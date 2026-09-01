use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct GenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct GenerateResponse {
    response: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

#[derive(Deserialize)]
struct ChatResponse {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct TagsResponse {
    models: Option<Vec<ModelInfo>>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct ModelInfo {
    pub name: String,
    pub size: Option<u64>,
}

pub async fn check_status(url: &str) -> Result<bool, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;
    match client.get(url).send().await {
        Ok(r) => Ok(r.status().is_success()),
        Err(_) => Ok(false),
    }
}

pub async fn list_models(url: &str) -> Result<Vec<ModelInfo>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get(format!("{}/api/tags", url))
        .send()
        .await
        .map_err(|e| format!("Connexion impossible: {}", e))?;
    let tags: TagsResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(tags.models.unwrap_or_default())
}

pub async fn categorize(
    url: &str,
    model: &str,
    description: &str,
    categories: &[(String, String)],
) -> Result<String, String> {
    let list = categories.iter()
        .map(|(id, name)| format!("- \"{}\" (id: {})", name, id))
        .collect::<Vec<_>>()
        .join("\n");

    let prompt = format!(
        "Tu catégorises des transactions bancaires. Catégories disponibles:\n{}\n\n\
         Transaction: \"{}\"\n\n\
         Réponds UNIQUEMENT avec l'id de la catégorie la plus adaptée. Aucun autre texte.",
        list, description
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post(format!("{}/api/generate", url))
        .json(&GenerateRequest { model: model.into(), prompt, stream: false })
        .send()
        .await
        .map_err(|e| format!("Ollama non disponible: {}", e))?;

    let gen: GenerateResponse = resp.json().await.map_err(|e| e.to_string())?;
    let answer = gen.response.trim().to_string();

    for (id, _) in categories {
        if answer.contains(id.as_str()) {
            return Ok(id.clone());
        }
    }

    Ok(answer)
}

pub async fn chat(
    url: &str,
    model: &str,
    user_messages: Vec<ChatMessage>,
    financial_context: &str,
) -> Result<String, String> {
    let system = ChatMessage {
        role: "system".into(),
        content: format!(
            "Tu es un conseiller financier personnel intégré à l'application econom'eyes. \
             Tu aides l'utilisateur à gérer son budget et ses finances. \
             Réponds en français, de manière concise et pratique.\n\n\
             Contexte financier actuel:\n{}",
            financial_context
        ),
    };

    let mut messages = vec![system];
    messages.extend(user_messages);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post(format!("{}/api/chat", url))
        .json(&ChatRequest { model: model.into(), messages, stream: false })
        .send()
        .await
        .map_err(|e| format!("Ollama non disponible: {}", e))?;

    let chat_resp: ChatResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(chat_resp.message.content)
}
