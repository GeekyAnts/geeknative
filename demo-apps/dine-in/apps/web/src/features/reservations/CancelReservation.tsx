import { useState } from 'react'
import { ConfirmationDialog } from '#/core/designsystem/ConfirmationDialog'
import type { Restaurant } from '#/features/catalog/Catalog'
import { Formatters } from '#/features/catalog/Formatters'
import { strings } from '#/generated/strings'
import type { Reservation } from './Reservation'
import { useCancelReservation } from './useReservations'

/** The cancel confirmation (spec/features/reservations.md): ask, then cancel and refresh every list. */
export function useCancelFlow(onCancelled?: (reservation: Reservation) => void) {
  const cancelReservation = useCancelReservation()
  const [target, setTarget] = useState<{ reservation: Reservation; restaurant?: Restaurant } | null>(null)

  const confirm = async () => {
    if (!target) return
    const { reservation } = target
    setTarget(null)
    const cancelled = await cancelReservation(reservation.id)
    onCancelled?.(cancelled)
  }

  return {
    ask: (reservation: Reservation, restaurant?: Restaurant) => setTarget({ reservation, restaurant }),
    dialog: (
      <ConfirmationDialog
        open={target !== null}
        title={strings.cancelTitle}
        message={
          target
            ? strings.cancelBody({
                restaurant: target.restaurant?.name ?? '',
                date: Formatters.dateShort(target.reservation.date),
                time: Formatters.time(target.reservation.time),
              })
            : ''
        }
        confirmLabel={strings.cancelConfirm}
        cancelLabel={strings.cancelKeep}
        destructive
        onConfirm={() => void confirm()}
        onCancel={() => setTarget(null)}
        confirmTestId="cancel.confirm"
        cancelTestId="cancel.keep"
      />
    ),
  }
}
