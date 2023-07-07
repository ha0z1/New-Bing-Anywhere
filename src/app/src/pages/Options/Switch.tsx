import { Switch, SwitchProps } from 'antd'
import { FC } from 'react'
const noop = () => {}

interface CustomSwitchProps extends SwitchProps {
  onBeforeChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<boolean>
}

const CustomSwitch: FC<CustomSwitchProps> = (customProps) => {
  const { onChange = noop, onBeforeChange, ...props } = customProps
  return (
    <Switch
      {...props}
      onChange={async (checked, event) => {
        // console.log("typeof onBeforeChange === 'function'", typeof onBeforeChange === 'function')
        let doNext = true
        if (typeof onBeforeChange === 'function') {
          doNext = await onBeforeChange(checked, event)
          // console.log('doNext', doNext)
        }
        if (!doNext) {
          onChange?.(!checked, event)
          return
        }
        onChange?.(checked, event)
      }}
    />
  )
}

export default CustomSwitch
