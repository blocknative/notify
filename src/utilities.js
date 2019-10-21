export function argsEqual(args1, args2) {
  return JSON.stringify(args1) === JSON.stringify(args2)
}

export function timeString(time) {
  const seconds = Math.floor(time / 1000)
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min` : `${seconds} sec`
}

export function formatTime(number) {
  const time = new Date(number)
  return time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true
  })
}

// will update object(merge new data) in list if it passes predicate, otherwise adds new object
export function replaceOrAdd(list, predicate, data) {
  const clone = [...list]
  const index = clone.findIndex(predicate)

  if (index !== -1) {
    const { startTime } = clone[index]
    clone[index] = { ...data, startTime }
    return clone
  }

  return [...list, data]
}

export function extractMessageFromError(error) {
  if (!error.stack || !error.message) {
    return {
      eventCode: "txError",
      errorMsg: "An unknown error occured"
    }
  }

  const message = error.stack || error.message

  if (message.includes("User denied transaction signature")) {
    return {
      eventCode: "txSendFail",
      errorMsg: "User denied transaction signature"
    }
  }

  if (message.includes("transaction underpriced")) {
    return {
      eventCode: "txUnderpriced",
      errorMsg: "Transaction is under priced"
    }
  }

  return {
    eventCode: "txError",
    errorMsg: message
  }
}

export function createEmitter() {
  return {
    listeners: {},
    on: function(eventCode, listener) {
      // check if valid eventCode
      switch (eventCode) {
        case "txSent":
        case "txPool":
        case "txConfirmed":
        case "txSpeedUp":
        case "txCancel":
        case "txFailed":
        case "txRequest":
        case "nsfFail":
        case "txRepeat":
        case "txAwaitingApproval":
        case "txConfirmReminder":
        case "txSendFail":
        case "txError":
        case "txUnderPriced":
        case "all":
          break
        default:
          throw new Error(
            `${eventCode} is not a valid event code, for a list of valid event codes see: https://github.com/blocknative/notify`
          )
      }

      // check that listener is a function
      if (typeof listener !== "function") {
        throw new Error("Listener must be a function")
      }

      // add listener for the eventCode
      this.listeners[eventCode] = listener
    }
  }
}
