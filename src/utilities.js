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

export function removeUndefined(obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key]
    }

    return newObj
  }, {})
}

// will update object(merge new data) in list if it passes predicate, otherwise adds new object
export function updateOrAdd(list, predicate, data) {
  const clone = [...list]
  const index = clone.findIndex(predicate)

  if (index !== -1) {
    clone[index] = { ...clone[index], ...removeUndefined(data) }
    return clone
  }

  return [...list, removeUndefined(data)]
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
