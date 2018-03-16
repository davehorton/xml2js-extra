# xml2js-extra
XmlElement wrapper for xml2js that provides namespace support

## Usage

In the example below, assume the following xml document has been ingested into a string variable referenced as 'someContent':
```xml
<?xml version="1.0" encoding="UTF-8"?>
<presence xmlns="urn:ietf:params:xml:ns:pidf"
xmlns:dm="urn:ietf:params:xml:ns:pidf:data-model"
xmlns:rpid="urn:ietf:params:xml:ns:pidf:rpid"
 entity="sip:151484@sip.qa.phone.com">
<tuple id="dbac281a0de5d15043">
<status>
<basic>closed</basic>
</status>
</tuple>
<dm:person id="b7ff289adcf65f0088">
<dm:note>Busy</dm:note>
</dm:person>
</presence>
```

```js
const XmlElement = require('xml2js-extra');
const parseString = require('xml2js').parseString;

parseString(someContent, (err, obj) => {
  const tag = Object.keys(obj)[0];
  const xmlElement = new XmlElement(tag, obj[tag]);
  
  console.log(xmlElement.tag);
  // 'presence'

  console.log(xmlElement.namespace);
  // 'urn:ietf:params:xml:ns:pidf'

  console.log(xmlElement.getChildren().map((c) => c.tag));
  //  [ 'tuple', 'dm:person' ]

  console.log(xmlElement.getChildren('tuple').map((c) => c.tag));
  //  [ 'tuple' ]

  console.log(xmlElement.getChildren('dm:person').map((c) => c.tag));
  //  [ 'dm:person' ]

  console.log(xmlElement.getChildren('person', 'urn:ietf:params:xml:ns:pidf:data-model').map((c) => c.tag));
  //  [ 'dm:person' ]

  console.log(xmlElement.getChildren('dm:person')[0].attributes;
  //  { id: 'b7ff289adcf65f0088' }

  console.log(xmlElement.getChildren('dm:person')[0].getAttribute('id'));
  // 'b7ff289adcf65f0088'

  console.log(xmlElement.getChildren('dm:person')[0].hasAttribute('does-not-exist'));
  // false

  console.log(xmlElement.getChildren('tuple')[0].getChildren('status')[0].getChildren('basic')[0].content);
  // 'closed'
```