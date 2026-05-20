/// Starts the Zembra Tauri desktop application.
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Zembra desktop app");
}
