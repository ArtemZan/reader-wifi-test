function _ping() {
    print("Got ping")
    Shelly.emitEvent("ping", "ping")
}