const fs = require('fs');

const file = 'e:/techforbs/Timey-Test/timey/src/app/admin/employees/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetImport = `import { useEffect, useState, useMemo } from "react";`;
const replacementImport = `import { useEffect, useState, useMemo, useRef } from "react";`;

content = content.replace(targetImport, replacementImport);

const targetAddEmpty = `import AddEmployeeModal from "@/components/AddEmployeeModal";\r
\r
function AvatarCircle`;

const targetAddEmptyUnix = `import AddEmployeeModal from "@/components/AddEmployeeModal";\n\nfunction AvatarCircle`;

const replacementAddEmpty = `import AddEmployeeModal from "@/components/AddEmployeeModal";\nimport ActionMenu from "@/components/ActionMenu";\n\nfunction AvatarCircle`;

content = content.replace(targetAddEmpty, replacementAddEmpty).replace(targetAddEmptyUnix, replacementAddEmpty);

const doubleRef = `  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});\r
  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});`;

const doubleRefUnix = `  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});\n  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});`;

const singleRef = `  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});`;

content = content.replace(doubleRef, singleRef).replace(doubleRefUnix, singleRef);

fs.writeFileSync(file, content);
console.log('Done patching admin/employees/page.tsx');
