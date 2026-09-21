const test=require('node:test');
const assert=require('node:assert/strict');
const {makeDocx}=require('../js/minutes-docx.js');
test('exportación Word genera un ZIP OOXML real y conserva texto español',async()=>{
  const blob=makeDocx({title:'Reunión de prueba',date:'18 de septiembre de 2026',participants:'Diego y Catalina',
    sections:{summary:'Revisión del mes',agreements:'Sí hubo acuerdos'},sourceSegments:5});
  assert.equal(blob.type,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const bytes=Buffer.from(await blob.arrayBuffer());
  assert.equal(bytes.readUInt32LE(0),0x04034b50);
  assert.ok(bytes.includes(Buffer.from('[Content_Types].xml')));
  assert.ok(bytes.includes(Buffer.from('word/document.xml')));
  assert.ok(bytes.includes(Buffer.from('Sí hubo acuerdos')));
});
