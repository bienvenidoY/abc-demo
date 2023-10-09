#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use tauri::api::process::Command;
use tauri::{CustomMenuItem, Menu, Submenu, MenuItem};


fn main() {
    let context = tauri::generate_context!();


    // `new_sidecar()` expects just the filename, NOT the whole path like in JavaScript
    // let (mut rx, mut child) = Command::new_sidecar("app")
    //   .expect("failed to create `my-sidecar` binary command")
    //   .spawn()
    //   .expect("Failed to spawn sidecar");

    let edit_menu = Submenu::new("编辑", Menu::new()
      .add_native_item(MenuItem::Separator)
      .add_native_item(MenuItem::Cut)
      .add_native_item(MenuItem::Copy)
      .add_native_item(MenuItem::Paste)
      .add_native_item(MenuItem::SelectAll));
    tauri::Builder::default()
    /* .setup(|app| {
              // 获取应用的执行路径
                  let current_path = std::env::current_exe().expect("Failed to get current executable path");

                  // 构建 Node.js 服务的入口文件路径
                  let node_script_path = current_path
                      .parent()
                      .expect("Failed to get parent directory")
                      .join("../../../scripts/server.js");

                  // 启动 Node.js 服务
                  let _ = Command::new("node")
                      .arg(&node_script_path)
                      .spawn()
                      .expect("Failed to start Node.js server");

                // 更多的初始化代码...
                Ok(())
            }) */
        .menu(
            Menu::new().add_submenu(Submenu::new(
                "File",
                Menu::new()
                    .add_item(CustomMenuItem::new("close", "退出").accelerator("cmdOrControl+Q")),

            ))
             .add_submenu(edit_menu)
        )
        .on_menu_event(|event| match event.menu_item_id() {
            "close" => {
                event.window().close().unwrap();
            }
            _ => {}
        })
        .run(context)
        .expect("error while running tauri application");
}
