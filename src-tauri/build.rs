fn main() {
    let temp = std::env::var("TEMP").unwrap_or_else(|_| std::env::var("TMP").unwrap_or_else(|_| ".".into()));
    let safe_dir = std::path::PathBuf::from(&temp).join("economeyes-build");
    std::fs::create_dir_all(&safe_dir).ok();
    let safe_icon = safe_dir.join("icon.ico");

    let src_icon = std::path::Path::new("icons/icon.ico");
    if src_icon.exists() {
        std::fs::copy(src_icon, &safe_icon).expect("failed to copy icon");
    }

    let attrs = tauri_build::Attributes::new().windows_attributes(
        tauri_build::WindowsAttributes::new().window_icon_path(safe_icon),
    );
    tauri_build::try_build(attrs).expect("failed to run tauri-build");
}
