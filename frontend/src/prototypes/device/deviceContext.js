import { createContext, useContext } from 'react'

// What the demo inside a frame needs to know about it.
//   device    'mobile' | 'tablet' | 'web'
//   scale     how much the frame is shrunk to fit the page (1 = natural size). Pointer
//             movements are measured in screen pixels, so drag code divides by this.
//   frameless true on real phones, where the demo fills the screen instead of sitting in a mockup
export const DeviceContext = createContext({ device: 'mobile', scale: 1, frameless: false })

export const useDevice = () => useContext(DeviceContext)

// Screen sizes in CSS pixels (the area the app draws in, inside the bezel).
export const DEVICES = {
  mobile: { label: 'Mobile', width: 390, height: 760 },
  tablet: { label: 'Tablet', width: 768, height: 940 },
  web: { label: 'Web', width: 1120, height: 660 },
}
