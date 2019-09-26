import { _ } from "svelte-i18n"
import BigNumber from "bignumber.js"
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
    value,
    asset
  } = details

  const type = eventToType(eventCode)
  const key = `${id}-${customization.eventCode || eventCode}`
  const counterpartyShortened =
    counterparty &&
    counterparty.substring(0, 4) +
      "..." +
      counterparty.substring(counterparty.length - 4)

  // const formatterOptions = counterparty
  //   ? [
  //       `watched.${eventCode}`,
  //       {
  //         verb:
  //           eventCode === "txConfirmed"
  //             ? direction === "incoming"
  //               ? "received"
  //               : "sent"
  //             : direction === "incoming"
  //             ? "receiving"
  //             : "sending",
  //         formattedValue: BigNumber(value)
  //           .div(BigNumber("1000000000000000000"))
  //           .toString(),
  //         preposition: direction === "incoming" ? "from" : "to",
  //         counterpartyShortened,
  //         asset
  //       }
  //     ]
  //   : [`transaction.${eventCode}`]

  const formatterOptions = [`transaction.${eventCode}`]

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
