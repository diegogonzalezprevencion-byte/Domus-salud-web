/* Generador DOCX local (OOXML + ZIP sin comprimir). No servicios externos ni CDN. */
(function (root) {
  'use strict';
  const utf8=new TextEncoder();
  const xml=(s)=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
  function crc32(bytes) {
    let crc=0xffffffff;
    for(const byte of bytes){crc^=byte;for(let b=0;b<8;b++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;}
    return (crc^0xffffffff)>>>0;
  }
  function zipStored(entries) {
    const local=[],central=[];let offset=0;
    const number=(view,at,value,len)=>len===2?view.setUint16(at,value,true):view.setUint32(at,value,true);
    for(const [filename,content] of entries){
      const name=utf8.encode(filename), data=utf8.encode(content), crc=crc32(data);
      const localHeader=new Uint8Array(30+name.length),h=new DataView(localHeader.buffer);
      number(h,0,0x04034b50,4);number(h,4,20,2);number(h,6,0x0800,2);number(h,8,0,2);
      number(h,14,crc,4);number(h,18,data.length,4);number(h,22,data.length,4);
      number(h,26,name.length,2);localHeader.set(name,30);
      const centralHeader=new Uint8Array(46+name.length),c=new DataView(centralHeader.buffer);
      number(c,0,0x02014b50,4);number(c,4,20,2);number(c,6,20,2);number(c,8,0x0800,2);
      number(c,16,crc,4);number(c,20,data.length,4);number(c,24,data.length,4);
      number(c,28,name.length,2);number(c,42,offset,4);centralHeader.set(name,46);
      local.push(localHeader,data);central.push(centralHeader);
      offset+=localHeader.length+data.length;
    }
    const centralSize=central.reduce((n,bytes)=>n+bytes.length,0);
    const end=new Uint8Array(22),e=new DataView(end.buffer);
    number(e,0,0x06054b50,4);number(e,8,entries.length,2);number(e,10,entries.length,2);
    number(e,12,centralSize,4);number(e,16,offset,4);
    return new Blob([...local,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  function paragraph(text,bold=false) {
    const lines=String(text??'').split('\n');
    return lines.map((line)=>`<w:p><w:pPr><w:spacing w:after="130"/></w:pPr><w:r>${bold?'<w:rPr><w:b/><w:color w:val="147A80"/></w:rPr>':''}<w:t xml:space="preserve">${xml(line||' ')}</w:t></w:r></w:p>`).join('');
  }
  function makeDocx({title,date,participants,sections,sourceSegments}) {
    const headings={summary:'Resumen ejecutivo',topics:'Temas tratados',agreements:'Acuerdos confirmados',
      commitments:'Compromisos, responsables y plazos',pending:'Pendientes',notes:'Observaciones y aspectos por confirmar'};
    const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`+
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`+
      paragraph('DOMUS SALUD · ACTA DE REUNIÓN',true)+paragraph(`Reunión: ${title}`)+
      paragraph(`Fecha: ${date}`)+paragraph(`Invitados: ${participants}`)+paragraph('Estado: Aprobada')+
      Object.entries(headings).map(([key,label])=>paragraph(label,true)+paragraph(sections[key]||'No informado en el acta.')).join('')+
      paragraph(`Revisión de administración · Fuente: ${sourceSegments} fragmentos transcritos.`)+
      `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>`;
    const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`+
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`+
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`+
      `<Default Extension="xml" ContentType="application/xml"/>`+
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
    const relationships=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`+
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    return zipStored([['[Content_Types].xml',types],['_rels/.rels',relationships],['word/document.xml',doc]]);
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={makeDocx};
  if(root)root.DomusDocx={makeDocx};
})(typeof window!=='undefined'?window:undefined);
