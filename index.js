const _ = require('lodash');
const debug = require('debug')('drachtio:presence-parser');

function parseContent(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

/** XmlElement class that provides helper methods for manipulating xml2js output */
class XmlElement {

  /**
   * @constructor
   *
   * Creates an instance of an XMLElement from data returned from xml2j parser
   *
   * @param  {string} tag  tag value of top-level xml element
   * @param  {object} data content for top-level xml element, as returned from xml2j
   * @param  {string} ns   [namespaces supplied with this object]
   * @return {[type]}      [description]
   */
  constructor(tag, data, ns) {
    debug(`XmlElement tag: ${tag} data: ${JSON.stringify(data)}`);

    this._tag = tag;
    this._data = data;
    this._ns = ns || {};
    this._attributes = {};

    // add in any local namespaces
    _.each(data.$ || {}, (value, key) => {
      if (0 === key.indexOf('xmlns')) {
        const urn = value;
        let namespace;
        const arr = /^(.+):(.+)$/.exec(key);
        if (arr) {
          namespace = arr[2];
        }
        this._ns[urn] = namespace || '';
      }
      else {
        this._attributes[key] = value;
      }
    });

    // find my namespace;
    const arr = /^(.+):(.+)$/.exec(tag);
    if (arr) {
      this._namespace = _.invert(this._ns)[arr[1]];
    }
    else {
      this._namespace = _.invert(this._ns)[''];
    }

    // parse content
    if (typeof data === 'object' && data._) {
      this._content = parseContent(data._);
    }
    else if (typeof data === 'string' || Array.isArray(data)) {
      this._content = parseContent(data);
    }

    // parse children
    this._children = [];
    if (typeof data === 'object' && !Array.isArray(data)) {
      _.each(_.pickBy(data, (value, key) => key !== '$' && key !== '_'), (value, key) => {
        if (Array.isArray(value)) {
          Array.prototype.push.apply(this._children, value.map((el) => {
            return new XmlElement(key, el, this._ns);
          }));
        }
        else {
          this._children.push(new XmlElement(key, value, this._ns));
        }
      });
    }

    debug(JSON.stringify(this));
  }

  /**
   * my namespace
   * @return {string} namespace
   */
  get namespace() {
    return this._namespace;
  }

  /**
   * xml tag
   * @return {string} tag
   */
  get tag() {
    return this._tag;
  }

  /**
   * xml attributes
   * @return {Arrary} attributes
   */
  get attributes() {
    return this._attributes;
  }

  /**
   * xml content
   * @return {string|Array} content
   */
  get content() {
    return this._content;
  }

  /**
   * child xml elements
   * @return {Array}  child elements
   */
  get children() {
    return this._children;
  }

  /**
   * get attribute value by name
   * @param  {string} attr name of attribute
   * @return {string}      attribute value
   */
  getAttribute(attr) {
    return this._attributes[attr];
  }

  /**
   * returns true if attribute exists
   * @param  {string}  attr name of attribute
   * @return {Boolean}      true if attribute exists
   */
  hasAttribute(attr) {
    return attr in this._attributes;
  }

  /**
   * returns true if the element has child elements
   * @return {Boolean} true if there are child elements
   */
  hasChildren() {
    return this._children.length > 1;
  }

  /**
   * get all or some of the elements children
   * @param  {[string]} name tag name to filter
   * @param  {[string]} urn  identifies xml namespace for supplied tag
   * @return {Array}      child elements
   */
  getChildren(name, urn) {
    if (!name) return this._children;
    else if (!urn) return _.filter(this._children, (c) => c.tag === name);
    else {
      const ns = this._ns[urn];
      if (ns) {
        const prefixedName = `${(this._ns[urn] + ':' || '')}${name}`;
        return _.filter(this._children, (c) => c.tag === prefixedName);
      }
      return _.filter(this._children, (c) => c.tag === name);
    }
  }

  /**
   * returns true if urn is one of the namespaces supplied with the xml document
   * @param  {string}  urn identifies an xml namespace
   * @return {Boolean}     true if the namespace was supplied with the xml document
   */
  hasUrn(urn) {
    return urn in this._ns;
  }

  toJSON() {
    return {
      tag: this.tag,
      namespace: this._namespace,
      namespaces: this._ns,
      attributes: this.attributes,
      content: this.content,
      children: this.children
    };
  }
  getNamespaceForUrn(urn) {
    if (!this.hasUrn(urn)) throw new Error(`urn undefined: use \`hasUrn\` first: ${urn}`);
    return this._ns[urn];
  }
}

module.exports = XmlElement;
