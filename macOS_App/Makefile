APP_NAME = PollMe
APP_BUNDLE = $(APP_NAME).app
EXECUTABLE = PollMeCompanionApp
SWIFT_FILE = PollMeCompanion.swift

all: $(APP_BUNDLE)

$(APP_BUNDLE): $(SWIFT_FILE) Info.plist
	@echo "Compiling Swift code..."
	swiftc $(SWIFT_FILE) -o $(EXECUTABLE)
	@echo "Creating app bundle structure..."
	mkdir -p $(APP_BUNDLE)/Contents/MacOS
	mv $(EXECUTABLE) $(APP_BUNDLE)/Contents/MacOS/$(APP_NAME)
	@echo "Copying Info.plist..."
	cp Info.plist $(APP_BUNDLE)/Contents/
	@echo "Done! $(APP_BUNDLE) has been created."

clean:
	rm -rf $(APP_BUNDLE) $(EXECUTABLE)
