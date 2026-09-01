import { describe, test, expect } from 'vitest'
import {
  fadeUp, fadeUpSm, fadeLeft, fadeRight, floatIn3D, cardEnter3D, staggerContainer,
  staggerItem, staggerItem3D, pageTransition, panelAnim, drawerAnim, hoverLift, hoverPop,
  EASE_SPRING, EASE_OUT_EXPO,
} from '@/lib/animations'

describe('animations — helpers de entrada con delay', () => {
  test('fadeUp usa delay 0 por defecto y lo propaga a la transición', () => {
    expect(fadeUp().transition).toMatchObject({ duration: 0.5, delay: 0, ease: EASE_SPRING })
    expect(fadeUp(0.3).transition).toMatchObject({ delay: 0.3 })
  })

  test('fadeUpSm propaga el delay recibido', () => {
    expect(fadeUpSm(0.2).transition).toMatchObject({ duration: 0.4, delay: 0.2, ease: EASE_SPRING })
  })

  test('fadeLeft entra desde x negativo y propaga el delay', () => {
    const anim = fadeLeft(0.15)
    expect(anim.initial).toMatchObject({ opacity: 0, x: -28 })
    expect(anim.transition).toMatchObject({ duration: 0.55, delay: 0.15, ease: EASE_SPRING })
  })

  test('fadeRight entra desde x positivo y propaga el delay', () => {
    const anim = fadeRight(0.15)
    expect(anim.initial).toMatchObject({ opacity: 0, x: 28 })
    expect(anim.transition).toMatchObject({ duration: 0.55, delay: 0.15, ease: EASE_SPRING })
  })

  test('floatIn3D aplica el mismo delay a la transición general y a rotateX', () => {
    const anim = floatIn3D(0.25)
    expect(anim.initial).toMatchObject({ opacity: 0, rotateX: 8, scale: 0.97 })
    expect(anim.style).toMatchObject({ transformStyle: 'preserve-3d' })
    expect(anim.transition).toMatchObject({ duration: 0.65, delay: 0.25, ease: EASE_OUT_EXPO })
    expect((anim.transition as { rotateX: { delay: number } }).rotateX).toMatchObject({ duration: 0.7, delay: 0.25, ease: EASE_OUT_EXPO })
  })

  test('cardEnter3D calcula el delay como índice * 0.06', () => {
    expect(cardEnter3D(3).transition).toMatchObject({ delay: 3 * 0.06 })
    expect(cardEnter3D().transition).toMatchObject({ delay: 0 })
  })
})

describe('animations — staggerContainer y sus items', () => {
  test('usa los valores por defecto de stagger y delay entre hijos', () => {
    const variants = staggerContainer()
    expect(variants.animate).toMatchObject({ transition: { staggerChildren: 0.07, delayChildren: 0.08 } })
  })

  test('acepta valores personalizados de staggerChildren y delayChildren', () => {
    const variants = staggerContainer(0.12, 0.2)
    expect(variants.animate).toMatchObject({ transition: { staggerChildren: 0.12, delayChildren: 0.2 } })
  })

  test('staggerItem y staggerItem3D definen estados initial/animate', () => {
    expect(staggerItem.initial).toMatchObject({ opacity: 0 })
    expect(staggerItem3D.initial).toMatchObject({ opacity: 0, rotateX: 5 })
  })
})

describe('animations — transiciones de página y panel', () => {
  test('pageTransition, panelAnim y drawerAnim definen estados de entrada/salida', () => {
    expect(pageTransition.exit).toMatchObject({ opacity: 0 })
    expect(panelAnim.exit).toMatchObject({ opacity: 0, scale: 0.94 })
    expect(drawerAnim.exit).toMatchObject({ x: '100%' })
  })

  test('hoverLift y hoverPop definen estados rest/hover/tap', () => {
    expect(hoverLift.rest).toMatchObject({ y: 0 })
    expect(hoverLift.hover).toMatchObject({ y: -4 })
    expect(hoverPop.hover).toMatchObject({ scale: 1.03 })
    expect(hoverPop.tap).toMatchObject({ scale: 0.97 })
  })
})
