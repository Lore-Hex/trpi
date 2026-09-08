import AppKit
import Foundation

private func shellQuote(_ value: String) -> String {
	return "'" + value.replacingOccurrences(of: "'", with: "'\\''") + "'"
}

final class AppDelegate: NSObject, NSApplicationDelegate {
	func applicationDidFinishLaunching(_ notification: Notification) {
		do {
			guard let resourcesURL = Bundle.main.resourceURL else {
				throw CocoaError(.fileNoSuchFile)
			}
			let executableURL = resourcesURL.appendingPathComponent("tr-cowork")
			guard FileManager.default.isExecutableFile(atPath: executableURL.path) else {
				throw CocoaError(.fileNoSuchFile)
			}

			let commandURL = FileManager.default.temporaryDirectory
				.appendingPathComponent("TR-Confidential-Cowork-\(UUID().uuidString).command")
			let command = """
			#!/bin/zsh
			rm -f -- "$0"
			cd "$HOME"
			export TR_COWORK_PACKAGE_DIR=\(shellQuote(resourcesURL.path))
			exec \(shellQuote(executableURL.path))
			"""
			try command.write(to: commandURL, atomically: true, encoding: .utf8)
			try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: commandURL.path)

			guard NSWorkspace.shared.open(commandURL) else {
				throw CocoaError(.executableNotLoadable)
			}
		} catch {
			let alert = NSAlert()
			alert.alertStyle = .critical
			alert.messageText = "TR Confidential Cowork could not start"
			alert.informativeText = error.localizedDescription
			alert.runModal()
		}
		NSApplication.shared.terminate(nil)
	}
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.delegate = delegate
application.setActivationPolicy(.accessory)
application.run()
