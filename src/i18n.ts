export const defaultNotifyMessages: any = {
  en: {
    transaction: {
      txRequest: 'Your transaction is waiting for you to confirm',
      nsfFail: 'You have insufficient funds to complete this transaction',
      txUnderpriced:
        'The gas price for your transaction is too low, try again with a higher gas price',
      txRepeat: 'This could be a repeat transaction',
      txAwaitingApproval:
        'You have a previous transaction waiting for you to confirm',
      txConfirmReminder:
        'Please confirm your transaction to continue, the transaction window may be behind your browser',
      txSendFail: 'You rejected the transaction',
      txSent: 'Your transaction has been sent to the network',
      txStallPending:
        'Your transaction has stalled and has not entered the transaction pool',
      txStuck: 'Your transaction is stuck due to a nonce gap',
      txPool: 'Your transaction has started',
      txStallConfirmed:
        "Your transaction has stalled and hasn't been confirmed",
      txSpeedUp: 'Your transaction has been sped up',
      txCancel: 'Your transaction is being canceled',
      txFailed: 'Your transaction has failed',
      txConfirmed: 'Your transaction has succeeded',
      txError: 'Oops something went wrong, please try again'
    },
    watched: {
      txPool:
        'Your account is {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}',
      txSpeedUp:
        'Transaction for {formattedValue} {asset} {preposition} {counterpartyShortened} has been sped up',
      txCancel:
        'Transaction for {formattedValue} {asset} {preposition} {counterpartyShortened} has been canceled',
      txConfirmed:
        'Your account successfully {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}',
      txFailed:
        'Your account failed to {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}'
    },
    time: {
      minutes: 'min',
      seconds: 'sec'
    }
  },
  es: {
    transaction: {
      txRequest: 'Su transacción está esperando que confirme',
      nsfFail: 'No tiene fondos suficientes para completar esta transacción.',
      txUnderpriced:
        'El precio del gas para su transacción es demasiado bajo, intente nuevamente con un precio del gas más alto',
      txRepeat: 'Esto podría ser una transacción repetida',
      txAwaitingApproval:
        'Tienes una transacción anterior esperando que confirmes',
      txConfirmReminder:
        'Confirme su transacción para continuar, la ventana de transacción puede estar detrás de su navegador',
      txSendFail: 'Rechazaste la transacción',
      txSent: 'Su transacción ha sido enviada a la red.',
      txStallPending:
        'Su transacción se ha estancado y no ha ingresado al grupo de transacciones',
      txStuck: 'Su transacción está atascada debido a una brecha de nonce',
      txPool: 'Su transacción ha comenzado',
      txStallConfirmed:
        'Su transacción se ha estancado y no ha sido confirmada.',
      txSpeedUp: 'Su transacción ha sido acelerada',
      txCancel: 'Tu transacción está siendo cancelada',
      txFailed: 'Su transacción ha fallado',
      txConfirmed: 'Su transacción ha tenido éxito.',
      txError: 'Vaya, algo salió mal, por favor intente nuevamente'
    },
    watched: {
      txPool:
        'su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} {asset} {preposition, select, from {desde} to {a}} {counterpartyShortened}',
      txSpeedUp:
        'su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} {asset} {preposition, select, from {desde} to {a}} {counterpartyShortened}',
      txCancel:
        'su cuenta está {verb, select, receiving {recibiendo} sending {enviando}} {formattedValue} {asset} {preposition, select, from {desde} to {a}} {counterpartyShortened}',
      txConfirmed:
        'su cuenta {verb, select, received {recibió} sent {ha enviado}} con éxito {formattedValue} {asset} {preposition, select, from {de} to {a}} {counterpartyShortened}',
      txFailed:
        'su cuenta fallado {verb, select, received {recibió} sent {ha enviado}} con éxito {formattedValue} {asset} {preposition, select, from {de} to {a}} {counterpartyShortened}'
    },
    time: {
      minutes: 'min',
      seconds: 'sec'
    }
  }
}
