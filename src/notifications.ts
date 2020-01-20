import { _ } from 'svelte-i18n'
import BigNumber from 'bignumber.js'
import { notifications } from './stores'
import { eventToType, typeToDismissTimeout } from './defaults'
import { defaultNotifyMessages } from './i18n'

import { CustomNotificationObject, TransactionData } from './interfaces'

// subscribe to the formatter store
let formatter: any
_.subscribe((store: any) => (formatter = store))

export function createNotification(
  details: TransactionData,
  customization: CustomNotificationObject | boolean | undefined = {}
): void {
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

  const type: string = eventToType(eventCode)
  const key: string = `${id}-${(typeof customization === 'object' &&
    customization.eventCode) ||
    eventCode}`
  const counterpartyShortened: string | undefined =
    counterparty &&
    counterparty.substring(0, 4) +
      '...' +
      counterparty.substring(counterparty.length - 4)

  const formattedValue = new BigNumber(value || 0)
    .div(new BigNumber('1000000000000000000'))
    .toString(10)

  const formatterOptions =
    counterparty && value
      ? {
          messageId: `watched['${eventCode}']`,
          values: {
            verb:
              eventCode === 'txConfirmed'
                ? direction === 'incoming'
                  ? 'received'
                  : 'sent'
                : direction === 'incoming'
                ? 'receiving'
                : 'sending',
            formattedValue,
            preposition: direction === 'incoming' ? 'from' : 'to',
            counterpartyShortened,
            asset
          }
        }
      : {
          messageId: `transaction['${eventCode}']`,
          values: { formattedValue, asset }
        }

  const internationalizedMessage = formatter(formatterOptions.messageId, {
    values: formatterOptions.values
  })

  const noMessageAvailable =
    internationalizedMessage === formatterOptions.messageId

  const message = noMessageAvailable
    ? defaultNotifyMessages.en[counterparty ? 'watched' : 'transaction'][
        eventCode || ''
      ]
    : internationalizedMessage

  let notificationObject = {
    id: id || hash,
    type,
    key,
    startTime,
    eventCode,
    message,
    autoDismiss: typeToDismissTimeout(
      (typeof customization === 'object' && customization.type) || type
    )
  }

  if (typeof customization === 'object') {
    notificationObject = { ...notificationObject, ...customization }
  }

  notifications.add(notificationObject)
}
