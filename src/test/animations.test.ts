import { describe, test, expect } from 'vitest'
import {
  fadeUp, fadeUpSm, fadeLeft, fadeRight,
  floatIn3D, cardEnter3D,
  staggerContainer, staggerItem, staggerItem3D,
  pageTransition, panelAnim, drawerAnim,
  hoverLift, hoverPop,
} from '../lib/animations'

describe('animation presets', () => {
  test('fadeUp starts hidden and offset, animates to visible', () => {
    const preset = fadeUp(0.2)
    expect(preset.initial).toMatchObject({ opacity: 0, y: 20 })
    expect(preset.animate).toMatchObject({ opacity: 1, y: 0 })
    expect(preset.transition).toMatchObject({ delay: 0.2 })
  })

  test('fadeUpSm uses a smaller offset than fadeUp', () => {
    const preset = fadeUpSm()
    expect(preset.initial).toMatchObject({ opacity: 0, y: 12 })
  })

  test('fadeLeft enters from a negative x offset', () => {
    const preset = fadeLeft()
    expect(preset.initial).toMatchObject({ opacity: 0, x: -28 })
  })

  test('fadeRight enters from a positive x offset', () => {
    const preset = fadeRight()
    expect(preset.initial).toMatchObject({ opacity: 0, x: 28 })
  })

  test('floatIn3D adds rotateX and scale for depth', () => {
    const preset = floatIn3D(0.1)
    expect(preset.initial).toMatchObject({ opacity: 0, rotateX: 8, scale: 0.97 })
    expect(preset.style).toMatchObject({ transformStyle: 'preserve-3d' })
  })

  test('cardEnter3D staggers delay by index', () => {
    const first = cardEnter3D(0)
    const third = cardEnter3D(2)
    expect(first.transition).toMatchObject({ delay: 0 })
    expect(third.transition).toMatchObject({ delay: 0.12 })
  })

  test('staggerContainer applies custom timing to children', () => {
    const variants = staggerContainer(0.1, 0.05)
    expect(variants.animate).toMatchObject({ transition: { staggerChildren: 0.1, delayChildren: 0.05 } })
  })

  test('staggerItem and staggerItem3D define initial/animate states', () => {
    expect(staggerItem.initial).toMatchObject({ opacity: 0 })
    expect(staggerItem3D.initial).toMatchObject({ opacity: 0, rotateX: 5 })
  })

  test('pageTransition, panelAnim, drawerAnim define enter/exit states', () => {
    expect(pageTransition.exit).toMatchObject({ opacity: 0 })
    expect(panelAnim.exit).toMatchObject({ opacity: 0, scale: 0.94 })
    expect(drawerAnim.exit).toMatchObject({ x: '100%' })
  })

  test('hoverLift and hoverPop define rest/hover states', () => {
    expect(hoverLift.rest).toMatchObject({ y: 0 })
    expect(hoverLift.hover).toMatchObject({ y: -4 })
    expect(hoverPop.hover).toMatchObject({ scale: 1.03 })
    expect(hoverPop.tap).toMatchObject({ scale: 0.97 })
  })
})
