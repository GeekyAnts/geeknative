export function openDialog(dialog: HTMLDialogElement | null) {
  if (!dialog) return
  if (typeof dialog.showModal === 'function') dialog.showModal()
  else dialog.setAttribute('open', '')
}

export function closeDialog(dialog: HTMLDialogElement | null) {
  if (!dialog) return
  if (typeof dialog.close === 'function') dialog.close()
  else dialog.removeAttribute('open')
}
