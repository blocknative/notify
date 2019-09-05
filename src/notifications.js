import { notifications } from "./stores"
import { eventToType, eventToMessage, typeToDismissTimeout } from "./defaults"

export function createNotification(details, customization = {}) {
  const {
    id,
    hash,
    startTime,
    eventCode,
    direction,
    counterparty,
    value
  } = details

  const type = eventToType(eventCode)
  const key = `${id}-${customization.eventCode || eventCode}`

  const notificationObject = {
    id: id || hash,
    type,
    key,
    startTime,
    eventCode,
    message: eventToMessage(
      eventCode,
      direction,
      counterparty,
      value && value / 1000000000000000000
    ),
    autoDismiss: typeToDismissTimeout(type),
    ...customization
  }

  notifications.add(notificationObject)
}
