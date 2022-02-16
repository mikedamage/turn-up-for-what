import Base from './base.js'
import { execaCommand } from 'execa'

export default class CommandRunner extends Base {
  static defaults = {
    timeout: 0,
    shell: false,
  }

  constructor(options = {}) {
    super(options)
  }

  run(cmd) {
    return execaCommand(command, {
      shell: this.options.shell,
      timeout: this.options.timeout,
    })
  }
}
