use anyhow::{anyhow, Context, Result};
use reqwest::Client;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::{collections::HashMap, path::PathBuf, sync::Arc};
use tokio::sync::Mutex;
use yup_oauth2::{read_service_account_key, ServiceAccountAuthenticator};

const DATASTORE_SCOPE: &str = "https://www.googleapis.com/auth/datastore";

#[derive(Clone)]
pub struct FirestoreClient {
    project_id: String,
    http: Client,
    auth: Arc<Mutex<ServiceAccountAuthenticator>>,
}

#[derive(Debug, Deserialize)]
struct FirestoreDocument {
    fields: Option<HashMap<String, FirestoreValue>>,
}

#[derive(Debug, Deserialize)]
struct RunQueryItem {
    document: Option<FirestoreDocument>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum FirestoreValue {
    NullValue(String),
    BooleanValue(bool),
    IntegerValue(String),
    DoubleValue(f64),
    TimestampValue(String),
    StringValue(String),
    ArrayValue { values: Option<Vec<FirestoreValue>> },
    MapValue { fields: Option<HashMap<String, FirestoreValue>> },
}

impl FirestoreClient {
    pub async fn new(project_id: String, service_account_json: PathBuf) -> Result<Self> {
        let key = read_service_account_key(service_account_json)
            .await
            .context("failed to read Firebase service account")?;
        let auth = ServiceAccountAuthenticator::builder(key)
            .build()
            .await
            .context("failed to build Firebase authenticator")?;
        Ok(Self {
            project_id,
            http: Client::new(),
            auth: Arc::new(Mutex::new(auth)),
        })
    }

    pub async fn get_document<T: DeserializeOwned>(
        &self,
        collection: &str,
        document_id: &str,
    ) -> Result<Option<T>> {
        let url = self.document_url(collection, document_id);
        let res = self
            .http
            .get(url)
            .bearer_auth(self.access_token().await?)
            .send()
            .await?;

        if res.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !res.status().is_success() {
            return Err(anyhow!("Firestore get failed: {}", res.text().await?));
        }

        let doc: FirestoreDocument = res.json().await?;
        let json = fields_to_json(doc.fields.unwrap_or_default());
        Ok(Some(serde_json::from_value(json)?))
    }

    pub async fn set_document<T: Serialize>(
        &self,
        collection: &str,
        document_id: &str,
        value: &T,
    ) -> Result<()> {
        let body = json!({ "fields": json_to_fields(serde_json::to_value(value)?)? });
        let res = self
            .http
            .patch(self.document_url(collection, document_id))
            .bearer_auth(self.access_token().await?)
            .json(&body)
            .send()
            .await?;
        if !res.status().is_success() {
            return Err(anyhow!("Firestore set failed: {}", res.text().await?));
        }
        Ok(())
    }

    pub async fn create_document<T: Serialize>(
        &self,
        collection: &str,
        document_id: &str,
        value: &T,
    ) -> Result<()> {
        self.set_document(collection, document_id, value).await
    }

    pub async fn query_array_contains<T: DeserializeOwned>(
        &self,
        collection: &str,
        field_path: &str,
        value: &str,
        order_by: Option<(&str, &str)>,
    ) -> Result<Vec<T>> {
        self.run_query(collection, field_path, "ARRAY_CONTAINS", value, order_by)
            .await
    }

    pub async fn query_equal<T: DeserializeOwned>(
        &self,
        collection: &str,
        field_path: &str,
        value: &str,
        order_by: Option<(&str, &str)>,
    ) -> Result<Vec<T>> {
        self.run_query(collection, field_path, "EQUAL", value, order_by)
            .await
    }

    async fn run_query<T: DeserializeOwned>(
        &self,
        collection: &str,
        field_path: &str,
        op: &str,
        value: &str,
        order_by: Option<(&str, &str)>,
    ) -> Result<Vec<T>> {
        let mut structured_query = json!({
            "from": [{ "collectionId": collection }],
            "where": {
                "fieldFilter": {
                    "field": { "fieldPath": field_path },
                    "op": op,
                    "value": { "stringValue": value }
                }
            }
        });

        if let Some((field, direction)) = order_by {
            structured_query["orderBy"] = json!([{
                "field": { "fieldPath": field },
                "direction": direction
            }]);
        }

        let body = json!({ "structuredQuery": structured_query });
        let res = self
            .http
            .post(format!(
                "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents:runQuery",
                self.project_id
            ))
            .bearer_auth(self.access_token().await?)
            .json(&body)
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("Firestore query failed: {}", res.text().await?));
        }

        let rows: Vec<RunQueryItem> = res.json().await?;
        rows.into_iter()
            .filter_map(|row| row.document)
            .map(|doc| {
                let json = fields_to_json(doc.fields.unwrap_or_default());
                serde_json::from_value(json).map_err(Into::into)
            })
            .collect()
    }

    async fn access_token(&self) -> Result<String> {
        let token = self.auth.lock().await.token(&[DATASTORE_SCOPE]).await?;
        token
            .token()
            .map(ToOwned::to_owned)
            .ok_or_else(|| anyhow!("Firebase access token was empty"))
    }

    fn document_url(&self, collection: &str, document_id: &str) -> String {
        format!(
            "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents/{}/{}",
            self.project_id, collection, document_id
        )
    }
}

fn json_to_fields(value: Value) -> Result<HashMap<String, FirestoreValue>> {
    match value {
        Value::Object(map) => map
            .into_iter()
            .map(|(key, value)| Ok((key, json_to_firestore_value(value)?)))
            .collect(),
        _ => Err(anyhow!("Firestore document root must be an object")),
    }
}

fn json_to_firestore_value(value: Value) -> Result<FirestoreValue> {
    Ok(match value {
        Value::Null => FirestoreValue::NullValue("NULL_VALUE".to_owned()),
        Value::Bool(v) => FirestoreValue::BooleanValue(v),
        Value::Number(v) if v.is_i64() || v.is_u64() => {
            FirestoreValue::IntegerValue(v.to_string())
        }
        Value::Number(v) => FirestoreValue::DoubleValue(v.as_f64().unwrap_or_default()),
        Value::String(v) => FirestoreValue::StringValue(v),
        Value::Array(values) => FirestoreValue::ArrayValue {
            values: Some(
                values
                    .into_iter()
                    .map(json_to_firestore_value)
                    .collect::<Result<Vec<_>>>()?,
            ),
        },
        Value::Object(map) => FirestoreValue::MapValue {
            fields: Some(
                map.into_iter()
                    .map(|(key, value)| Ok((key, json_to_firestore_value(value)?)))
                    .collect::<Result<HashMap<_, _>>>()?,
            ),
        },
    })
}

fn fields_to_json(fields: HashMap<String, FirestoreValue>) -> Value {
    Value::Object(
        fields
            .into_iter()
            .map(|(key, value)| (key, firestore_value_to_json(value)))
            .collect::<Map<_, _>>(),
    )
}

fn firestore_value_to_json(value: FirestoreValue) -> Value {
    match value {
        FirestoreValue::NullValue(_) => Value::Null,
        FirestoreValue::BooleanValue(v) => Value::Bool(v),
        FirestoreValue::IntegerValue(v) => json!(v.parse::<i64>().unwrap_or_default()),
        FirestoreValue::DoubleValue(v) => json!(v),
        FirestoreValue::TimestampValue(v) | FirestoreValue::StringValue(v) => Value::String(v),
        FirestoreValue::ArrayValue { values } => Value::Array(
            values
                .unwrap_or_default()
                .into_iter()
                .map(firestore_value_to_json)
                .collect(),
        ),
        FirestoreValue::MapValue { fields } => fields_to_json(fields.unwrap_or_default()),
    }
}

