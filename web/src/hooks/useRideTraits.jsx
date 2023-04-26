import { useEffect } from "react"
import { useState } from "react"
import { rescale } from "../utils"
import { useBLECharacteristic } from "./useBLECharacteristic"
import {
  BoardGeneration,
  inferBoardFromHardwareRevision,
} from "@rewheel/common"

const RideTrait = {
  angleOffset: 0,
  turnCompensation: 1,
  aggressiveness: 2,
  simpleStop: 3,
}

// ride traits min/max values
const ANGLE_OFFSET_SCALE_FACTOR = -0.05

const TURN_COMPENSATION_RAW_MIN = -100
const TURN_COMPENSATION_RAW_MAX = 100
const TURN_COMPENSATION_SCALED_MIN = 0
const TURN_COMPENSATION_SCALED_MAX = 10

const AGGRESSIVENESS_RAW_MIN = -80
const AGGRESSIVENESS_RAW_MAX = 127
const AGGRESSIVENESS_SCALED_MIN = 0
const AGGRESSIVENESS_SCALED_MAX = 10

export const useRideTraits = (generation) => {
  const {
    rideTrait,
    writeRideTrait,
    startRideTraitNotifications,
    stopRideTraitNotifications,
  } = useBLECharacteristic("rideTrait", {
    read: true,
    write: true,
    notify: true,
    autoMount: true,
  })

  const [state, setState] = useState({
    angleOffset: null,
    turnCompensation: null,
    aggressiveness: null,
    simpleStop: null,
  })

  const setRideTrait = async (trait, value) => {
    const data = new Uint8Array(2)
    const view = new DataView(data.buffer)
    view.setUint8(0, trait)
    view.setUint8(1, value)
    console.log("setting", trait, value)
    await writeRideTrait(view)
  }

  const setAngleOffset = async (angleOffset, invert, remoteTilt) => {
    setState({
      ...state,
      angleOffset,
    })
    angleOffset =
      Math.round(
        (invert ? -angleOffset : angleOffset) / ANGLE_OFFSET_SCALE_FACTOR
      ) + (remoteTilt ? 1 : 0)
    await setRideTrait(RideTrait.angleOffset, angleOffset)
  }

  const setTurnCompensation = async (turnCompensation) => {
    setState({
      ...state,
      turnCompensation,
    })
    turnCompensation = Math.round(
      rescale(
        turnCompensation,
        TURN_COMPENSATION_SCALED_MIN,
        TURN_COMPENSATION_SCALED_MAX,
        TURN_COMPENSATION_RAW_MIN,
        TURN_COMPENSATION_RAW_MAX
      )
    )
    await setRideTrait(RideTrait.turnCompensation, turnCompensation)
  }

  const setAggressiveness = async (aggressiveness) => {
    setState({
      ...state,
      aggressiveness,
    })
    aggressiveness = Math.round(
      rescale(
        aggressiveness,
        AGGRESSIVENESS_SCALED_MIN,
        AGGRESSIVENESS_SCALED_MAX,
        AGGRESSIVENESS_RAW_MIN,
        AGGRESSIVENESS_RAW_MAX
      )
    )
    await setRideTrait(RideTrait.aggressiveness, aggressiveness)
  }

  const setSimpleStop = async (enabled) => {
    setState({
      ...state,
      simpleStop: enabled,
    })
    await setRideTrait(RideTrait.simpleStop, enabled ? 0x01 : 0x00)
  }

  const { angleOffset, turnCompensation, aggressiveness, simpleStop } = state

  const isValid = () =>
    angleOffset !== null &&
    turnCompensation !== null &&
    aggressiveness !== null &&
    simpleStop !== null

  const refreshRideTraits = async () => {
    setState({
      angleOffset: null,
      turnCompensation: null,
      aggressiveness: null,
      simpleStop: null,
    })
    await startRideTraitNotifications()
  }

  useEffect(() => {
    refreshRideTraits()
  }, [])

  useEffect(() => {
    if (!rideTrait) return

    const traitType = rideTrait.getUint8(0)
    const value = rideTrait.getInt8(1)
    switch (traitType) {
      case RideTrait.angleOffset:
        setState({
          ...state,
          angleOffset: generation !== BoardGeneration.XR ? -(value * ANGLE_OFFSET_SCALE_FACTOR) : value * ANGLE_OFFSET_SCALE_FACTOR,
        })
        break
      case RideTrait.turnCompensation:
        setState({
          ...state,
          turnCompensation: rescale(
            value,
            TURN_COMPENSATION_RAW_MIN,
            TURN_COMPENSATION_RAW_MAX,
            TURN_COMPENSATION_SCALED_MIN,
            TURN_COMPENSATION_SCALED_MAX
          ),
        })
        break
      case RideTrait.aggressiveness:
        setState({
          ...state,
          aggressiveness: rescale(
            value,
            AGGRESSIVENESS_RAW_MIN,
            AGGRESSIVENESS_RAW_MAX,
            AGGRESSIVENESS_SCALED_MIN,
            AGGRESSIVENESS_SCALED_MAX
          ),
        })
        break
      case RideTrait.simpleStop:
        setState({
          ...state,
          simpleStop: value === 0x01,
        })
        break
    }

    if (isValid()) stopRideTraitNotifications()
  }, [rideTrait])

  return {
    ...state,
    valid: isValid(),
    setAngleOffset,
    setTurnCompensation,
    setAggressiveness,
    setSimpleStop,
    refreshRideTraits,
  }
}
