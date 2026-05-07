use anyhow::{Context, Result};
use std::{
    io::{self, Write},
    path::PathBuf,
};

#[derive(Clone, Debug)]
pub struct Config {
    pub app_host: String,
    pub app_port: u16,
    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub jwt_ttl_seconds: i64,
    pub firebase_project_id: String,
    pub firebase_service_account_json: PathBuf,
    pub allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        println!("=== Private Chat Backend Configuration ===");
        println!("Press Enter to use the default value shown in [brackets].\n");

        Ok(Self {
            app_host: prompt_or("Host to bind", "0.0.0.0"),
            app_port: prompt_or("Port to listen on", "8080")
                .parse()
                .context("invalid port number")?,
            jwt_secret: prompt_require("JWT secret key")?,
            jwt_issuer: prompt_or("JWT issuer", "private-chat"),
            jwt_ttl_seconds: prompt_or("JWT TTL in seconds", "2592000")
                .parse()
                .context("invalid JWT TTL")?,
            firebase_project_id: prompt_require("Firebase project ID")?,
            firebase_service_account_json: PathBuf::from(prompt_require_file(
                "Path to Firebase service account JSON",
            )?),
            allowed_origins: prompt_or(
                "Allowed CORS origins (comma-separated)",
                "http://localhost:3000",
            )
            .split(',')
            .map(|o| o.trim().to_owned())
            .filter(|o| !o.is_empty())
            .collect(),
        })
    }
}

fn prompt_or(label: &str, default: &str) -> String {
    print!("  {} [{}]: ", label, default);
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let trimmed = input.trim();
    if trimmed.is_empty() {
        default.to_owned()
    } else {
        trimmed.to_owned()
    }
}

fn prompt_require(label: &str) -> Result<String> {
    loop {
        print!("  {} (required): ", label);
        io::stdout().flush().unwrap();
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        let trimmed = input.trim().to_owned();
        if !trimmed.is_empty() {
            return Ok(trimmed);
        }
        println!("  !! This field is required.");
    }
}

fn prompt_require_file(label: &str) -> Result<String> {
    if let Ok(cwd) = std::env::current_dir() {
        println!("  (current directory: {})", cwd.display());
    }
    loop {
        print!("  {} (required): ", label);
        io::stdout().flush().unwrap();
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        let trimmed = input.trim().to_owned();
        if trimmed.is_empty() {
            println!("  !! This field is required.");
            continue;
        }
        if std::path::Path::new(&trimmed).exists() {
            return Ok(trimmed);
        }
        println!("  !! File not found: \"{}\". Check the path and try again.", trimmed);
    }
}
