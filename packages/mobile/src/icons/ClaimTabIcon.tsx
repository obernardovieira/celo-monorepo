import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class ClaimTabIcon extends React.Component<Props> {
  static defaultProps = {
    width: 22.5,
    height: 22.5,
    color: colors.darkSecondary,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 25 25"
        fill="none"
      >
        <Circle cx="8.5" cy="16.5" r="4.5" stroke={this.props.color} strokeWidth="2" />
      </Svg>
    )
  }
}
