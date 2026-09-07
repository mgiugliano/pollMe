APP_NAME = PollMe
APP_BUNDLE = $(APP_NAME).app
EXECUTABLE = PollMeCompanionApp
SWIFT_FILE = PollMeCompanion.swift

all: $(APP_BUNDLE)

$(APP_BUNDLE): $(SWIFT_FILE)
	@echo "Compiling Swift code..."
	swiftc $(SWIFT_FILE) -o $(EXECUTABLE)
	@echo "Creating app bundle structure..."
	mkdir -p $(APP_BUNDLE)/Contents/MacOS
	mv $(EXECUTABLE) $(APP_BUNDLE)/Contents/MacOS/$(APP_NAME)
	@echo "Creating Info.plist..."
	@cat << 'PLIST' > $(APP_BUNDLE)/Contents/Info.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>PollMe</string>
    <key>CFBundleIdentifier</key>
    <string>info.giugliano.PollMe</string>
    <key>CFBundleName</key>
    <string>PollMe</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppleEventsUsageDescription</key>
    <string>PollMe needs to read your Keynote presenter notes to display live polls.</string>
</dict>
</plist>
PLIST
	@echo "Done! $(APP_BUNDLE) has been created."

clean:
	rm -rf $(APP_BUNDLE) $(EXECUTABLE)
