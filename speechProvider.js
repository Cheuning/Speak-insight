const WEB_SPEECH_RECOGNITION = window.SpeechRecognition || window.webkitSpeechRecognition;

let activeController = null;
let nativeSpeechModulePromise = null;

export function isNativeSpeechEnvironment() {
    try {
        return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch (error) {
        return false;
    }
}

export function isWebSpeechSupported() {
    return Boolean(WEB_SPEECH_RECOGNITION);
}

export function isSpeechRecognitionSupported() {
    return isNativeSpeechEnvironment() || isWebSpeechSupported();
}

export async function startSpeechRecognition(options = {}) {
    await stopSpeechRecognition();

    if (isNativeSpeechEnvironment()) {
        const nativeController = await startNativeSpeechRecognition(options);
        if (nativeController) {
            activeController = nativeController;
            return activeController;
        }
    }

    if (isWebSpeechSupported()) {
        activeController = startWebSpeechRecognition(options);
        return activeController;
    }

    options.onError?.({ error: "not-supported" });
    activeController = createNoopController();
    return activeController;
}

export async function stopSpeechRecognition() {
    if (!activeController) return;

    const controller = activeController;
    activeController = null;

    try {
        await controller.stop?.();
    } catch (error) {
        console.warn("Speech recognition stop failed", error);
    }
}

function startWebSpeechRecognition({
    lang = "ko-KR",
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    onStart,
    onPartial,
    onFinal,
    onError,
    onEnd
} = {}) {
    const recognition = new WEB_SPEECH_RECOGNITION();
    let stopped = false;

    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
        onStart?.();
    };

    recognition.onresult = (event) => {
        const finalSegments = [];
        const interimSegments = [];

        for (let i = 0; i < event.results.length; i += 1) {
            const text = event.results[i]?.[0]?.transcript || "";
            if (!text) continue;

            if (event.results[i].isFinal) {
                finalSegments.push(text);
            } else {
                interimSegments.push(text);
            }
        }

        onFinal?.(finalSegments);
        onPartial?.(interimSegments);
    };

    recognition.onerror = (event) => {
        onError?.(event);
    };

    recognition.onend = () => {
        onEnd?.();
    };

    recognition.start();

    return {
        restart() {
            if (stopped) return;
            recognition.start();
        },
        stop() {
            if (stopped) return;
            stopped = true;
            recognition.onend = null;
            recognition.stop();
        }
    };
}

async function startNativeSpeechRecognition(options = {}) {
    const module = await loadNativeSpeechModule();
    const plugin = module?.SpeechRecognition || module?.SpeechRecognitionPlugin || module?.default;

    if (!plugin?.start) {
        options.onError?.({ error: "native-unavailable" });
        return null;
    }

    const listeners = [];

    if (typeof plugin.addListener === "function") {
        listeners.push(await addNativeListener(plugin, "partialResult", (event) => {
            const text = getNativeSpeechText(event);
            if (text) options.onPartial?.([text]);
        }));
        listeners.push(await addNativeListener(plugin, "result", (event) => {
            const text = getNativeSpeechText(event);
            if (text) options.onFinal?.([text]);
        }));
        listeners.push(await addNativeListener(plugin, "error", (event) => {
            options.onError?.(event);
        }));
    }

    let stopped = false;

    try {
        const startResult = await plugin.start({
            language: options.lang || "ko-KR",
            partialResults: options.interimResults !== false,
            popup: false
        });
        const resultText = getNativeSpeechText(startResult);
        if (resultText) options.onFinal?.([resultText]);
        options.onStart?.();
    } catch (error) {
        await removeNativeListeners(listeners);
        options.onError?.(error);
        return null;
    }

    return {
        async restart() {
            if (stopped) return;
            if (plugin.stop) await plugin.stop();
            await plugin.start({
                language: options.lang || "ko-KR",
                partialResults: options.interimResults !== false,
                popup: false
            });
        },
        async stop() {
            if (stopped) return;
            stopped = true;
            await removeNativeListeners(listeners);
            if (plugin.stop) await plugin.stop();
        }
    };
}

async function loadNativeSpeechModule() {
    if (!nativeSpeechModulePromise) {
        nativeSpeechModulePromise = import("@capgo/capacitor-speech-recognition").catch((error) => {
            console.warn("Native speech recognition module unavailable", error);
            return null;
        });
    }

    return nativeSpeechModulePromise;
}

async function addNativeListener(plugin, eventName, callback) {
    try {
        return await plugin.addListener(eventName, callback);
    } catch (error) {
        console.warn(`Native speech listener failed: ${eventName}`, error);
        return null;
    }
}

async function removeNativeListeners(listeners) {
    await Promise.all(listeners.map(async (listener) => {
        try {
            await listener?.remove?.();
        } catch (error) {
            console.warn("Native speech listener remove failed", error);
        }
    }));
}

function getNativeSpeechText(event) {
    if (typeof event === "string") return event;
    if (Array.isArray(event?.matches)) return event.matches[0] || "";
    if (Array.isArray(event?.value)) return event.value[0] || "";
    return event?.text || event?.transcript || event?.value || "";
}

function createNoopController() {
    return {
        restart() {},
        stop() {}
    };
}
