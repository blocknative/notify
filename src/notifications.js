import { _ } from "svelte-i18n"
import { notifications } from "./stores"
import { eventToType, typeToDismissTimeout } from "./defaults"

// subscribe to the formatter store
let formatter
_.subscribe(store => (formatter = store))

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
  const counterpartyShortened =
    counterparty &&
    counterparty.substring(0, 4) +
      "..." +
      counterparty.substring(counterparty.length - 4)

  const formatterOptions = counterparty
    ? [
        `watched.${eventCode}`,
        {
          verb:
            eventCode === "txConfirmed"
              ? direction === "incoming"
                ? "received"
                : "sent"
              : direction === "incoming"
              ? "receiving"
              : "sending",
          formattedValue: value / 1000000000000000000,
          preposition: direction === "incoming" ? "from" : "to",
          counterpartyShortened
        }
      ]
    : [`transaction.${eventCode}`]

  const notificationObject = {
    id: id || hash,
    type,
    key,
    startTime,
    eventCode,
    message: formatter(...formatterOptions),
    autoDismiss: typeToDismissTimeout(type),
    ...customization
  }

  notifications.add(notificationObject)
}
