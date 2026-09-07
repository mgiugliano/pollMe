import Cocoa
import WebKit
import Foundation

class PollWindow: NSWindow {
    override init(contentRect: NSRect, styleMask style: NSWindow.StyleMask, backing backingStoreType: NSWindow.BackingStoreType, defer flag: Bool) {
        super.init(contentRect: contentRect, styleMask: [.borderless], backing: backingStoreType, defer: flag)
        self.level = .screenSaver 
        self.backgroundColor = .clear
        self.isOpaque = false
        self.hasShadow = false
        self.ignoresMouseEvents = true 
        self.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle, .fullScreenAuxiliary]
    }
    override var canBecomeKey: Bool { return false }
}

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: PollWindow!
    var webView: WKWebView!
    var timer: Timer?
    var lastSlideNotes = ""
    var statusItem: NSStatusItem!
    
    // We assume there might be a stuck poll on the server when we start
    var isPollActiveOnServer = true 
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: Date.distantPast) {
            self.setupApp()
        }
    }
    
    func setupApp() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem.button {
            button.title = "📊"
        }
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Clear Current Poll", action: #selector(clearCurrentPoll), keyEquivalent: "c"))
        menu.addItem(NSMenuItem(title: "Clear All Polls", action: #selector(clearAllPolls), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit PollMe", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        statusItem.menu = menu
        
        let screenRect = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1024, height: 768)
        window = PollWindow(contentRect: screenRect, styleMask: [], backing: .buffered, defer: false)
        
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        webView = WKWebView(frame: window.contentView!.bounds, configuration: webConfiguration)
        webView.setValue(false, forKey: "drawsBackground") 
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        
        let url = URL(string: "https://yourdomain.com/poll/presenter.html")!
        webView.load(URLRequest(url: url))
        
        window.contentView?.addSubview(webView)
        window.makeKeyAndOrderFront(nil)
        window.alphaValue = 0.0
        
        timer = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(checkKeynote), userInfo: nil, repeats: true)
    }
    
    // When the webpage finishes loading, force close any stuck poll on the server just to be safe
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("if(window.closeActivePoll) window.closeActivePoll();", completionHandler: nil)
        isPollActiveOnServer = false
    }
    
    @objc func clearCurrentPoll() {
        webView.evaluateJavaScript("if(window.clearCurrentPoll) window.clearCurrentPoll();", completionHandler: nil)
    }
    
    @objc func clearAllPolls() {
        webView.evaluateJavaScript("if(window.clearAllPolls) window.clearAllPolls();", completionHandler: nil)
    }
    
    @objc func checkKeynote() {
        let playingScript = "tell application \"Keynote\" to get playing"
        var isPlaying = false
        if let appleScript = NSAppleScript(source: playingScript) {
            var error: NSDictionary?
            let descriptor = appleScript.executeAndReturnError(&error)
            isPlaying = descriptor.booleanValue
        }
        
        if !isPlaying {
            lastSlideNotes = "" 
            
            if window.alphaValue > 0.0 {
                NSAnimationContext.runAnimationGroup { context in
                    context.duration = 0.5
                    window.animator().alphaValue = 0.0
                }
            }
            
            if isPollActiveOnServer {
                webView.evaluateJavaScript("if(window.closeActivePoll) window.closeActivePoll();", completionHandler: nil)
                isPollActiveOnServer = false
            }
            return
        }

        let script = "tell application \"Keynote\" to get presenter notes of current slide of document 1"
        var error: NSDictionary?
        if let appleScript = NSAppleScript(source: script) {
            let result = appleScript.executeAndReturnError(&error)
            if let notes = result.stringValue {
                if notes != lastSlideNotes {
                    lastSlideNotes = notes
                    processNotes(notes)
                }
            }
        }
    }
    
    func processNotes(_ notes: String) {
        if notes.contains("[POLL]") {
            isPollActiveOnServer = true
            if window.alphaValue < 1.0 {
                NSAnimationContext.runAnimationGroup { context in
                    context.duration = 0.5
                    window.animator().alphaValue = 1.0
                }
            }
            let escapedNotes = notes.replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: "\\n")
            let js = "if(window.updatePollFromKeynote) { window.updatePollFromKeynote(\"\(escapedNotes)\"); }"
            webView.evaluateJavaScript(js, completionHandler: nil)
            
        } else {
            if window.alphaValue > 0.0 {
                NSAnimationContext.runAnimationGroup { context in
                    context.duration = 0.5
                    window.animator().alphaValue = 0.0
                }
            }
            
            if isPollActiveOnServer {
                webView.evaluateJavaScript("if(window.closeActivePoll) window.closeActivePoll();", completionHandler: nil)
                isPollActiveOnServer = false
            }
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
