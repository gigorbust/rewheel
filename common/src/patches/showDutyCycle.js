export const showDutyCycle = {
  attribution: [
    
  ],
  priority: 1,
  description: 'Reports duty cycle instead of yaw over Bluetooth',
  supported: [5],
  supportsOta: true,
  experimental: true,
  extraBytes: 1,
  modifications: [
    {
      data: {},
      append: true
    },
    {
      start: {
        5040: 0xaaaa,
      },
      data: {

      }
    },
    {
      transform: ({ firmware, modifiedFirmware, }) => modifiedFirmware
    }
  ]
}
