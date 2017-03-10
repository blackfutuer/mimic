import Service from './Service'
import SaxNativeImpl from './SaxNativeImpl'

class SaxNativeService extends Service {
  constructor () {
    super()
    this._name = 'sax_native_service'
  }
  getImpl () {
    return this._impl || (this._impl = new SaxNativeImpl())
  }
}

export default SaxNativeService
