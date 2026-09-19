// Node test runner: byte-level round-trip verification against real samples.
// Run via `npm test` (esbuild bundle -> node).
import * as fs from 'fs';
import { parseXfs, writeXfs, XfsDoc, XfsInstance } from '../src/xfs';
import { parseMtXml, writeMtXml } from '../src/fsmxml';
import { FsmModel } from '../src/model';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.error(`FAIL  ${name} ${detail}`); }
}

function walkInstances(root: XfsInstance, fn: (inst: XfsInstance) => void): void {
  const visit = (v: unknown): void => {
    if (v && typeof v === 'object') {
      if ('__vals__' in (v as Record<string, unknown>)) {
        const inst = v as XfsInstance;
        fn(inst);
        for (const val of Object.values(inst.__vals__)) {
          if (Array.isArray(val)) val.forEach(visit);
          else visit(val);
        }
      }
    }
  };
  visit(root);
}

const DEPLOYED = 'E:/SteamLibrary/steamapps/common/Monster Hunter World/nativePC/hm/wp/wp03/wp03_action.fsm';
const VANILLA = 'E:/MHW-arts/wp03_action.vanilla-seek2thrust.fsm';
const TESTFILE = 'E:/MHW-arts/wp03_action.test-see2thrust.fsm';
const XML = 'E:/MHW-arts/wp03_action.xml';

console.log('== XFS binary round-trip ==');
for (const path of [DEPLOYED, VANILLA]) {
  const label = path.split('/').pop();
  const orig = fs.readFileSync(path);
  let doc: XfsDoc;
  try {
    doc = parseXfs(orig);
    check(`${label}: parse`, true);
  } catch (e) {
    check(`${label}: parse`, false, String(e));
    continue;
  }
  const out = writeXfs(doc);
  check(`${label}: write byte-identical`, Buffer.compare(Buffer.from(out), orig) === 0,
    `len ${out.length} vs ${orig.length}`);
}

// structural checks on the deployed file
{
  const doc = parseXfs(fs.readFileSync(DEPLOYED));
  const rootCluster = doc.root.__vals__['mpRootCluster'] as XfsInstance;
  const nodes = rootCluster.__vals__['mpNodeList'];
  check('deployed: root name', doc.rootName === 'cFSMPl_W03', doc.rootName);
  check('deployed: 90 nodes', Array.isArray(nodes) && nodes.length === 90, String(Array.isArray(nodes) ? nodes.length : typeof nodes));
  const ct = doc.root.__vals__['mpConditionTree'] as XfsInstance;
  const trees = ct.__vals__['mpTreeList'];
  check('deployed: 307 condition trees', Array.isArray(trees) && trees.length === 307);
  // class names resolved
  const nodeDef = doc.defs[(nodes as XfsInstance[])[0].__class__];
  check('deployed: node class named', nodeDef.name === 'cAIFSMNode', nodeDef.name);
  // class count in header == instances written
  let count = 0;
  walkInstances(doc.root, () => count++);
  check('deployed: 2980 instances', count === 2980, String(count));
}

console.log('== MtSerializer XML ==');
{
  const text = fs.readFileSync(XML, 'utf-8');
  const doc = parseMtXml(text);
  check('xml: root name', doc.rootName === 'cFSMPl_W03', doc.rootName);
  const rootCluster = doc.root.__vals__['mpRootCluster'] as XfsInstance;
  const nodes = rootCluster.__vals__['mpNodeList'] as XfsInstance[];
  check('xml: 59 nodes', Array.isArray(nodes) && nodes.length === 59, String(nodes?.length));
  const out = writeMtXml(doc);
  fs.writeFileSync('.tmp/wp03_action.roundtrip.xml', out, 'utf-8');
  const re = parseMtXml(out);
  check('xml: parse(write(parse)) == parse', JSON.stringify(re.root) === JSON.stringify(doc.root));
  // semantic comparison against the binary parse of the same FSM version is
  // not possible (files differ); we check field presence instead
  const node0 = nodes[0];
  check('xml: node0 has mName + ActionNo chain',
    typeof node0.__vals__['mName'] === 'string' && !!node0.__vals__['mpProcessList']);
}

console.log('== XML -> binary conversion ==');
{
  const text = fs.readFileSync(XML, 'utf-8');
  const doc = parseMtXml(text);
  const out = writeXfs(doc);
  const re = parseXfs(out);
  check('xml->bin: reparses cleanly', true);
  check('xml->bin: root name preserved', re.rootName === doc.rootName);
  check('xml->bin: instance count plausible', out.length > 1000, String(out.length));
  fs.writeFileSync('.tmp/wp03_action.xml2bin.fsm', out);
}

console.log('== editing operations ==');
{
  const m = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'wp03_action.fsm');
  check('edit: pristine validates clean', m.validate().length === 0, m.validate().join('; '));

  m.snapshot();
  const cond = m.addCondition();
  const node = m.newNode('测试节点');
  m.setNodeActionNo(node, 123);
  m.addLink(node, 0, cond.index);
  const nodes2 = m.nodes();
  check('edit: node added', nodes2.length === 91);
  check('edit: actionNo set', m.nodeActionNo(node) === 123, String(m.nodeActionNo(node)));
  check('edit: link added', m.linksOf(node).length === 1);
  check('edit: condition added', m.conditions().length === 308);

  const bytes = m.toBinary();
  const m2 = FsmModel.fromBinary(bytes, 'roundtrip.fsm');
  check('edit: edited binary reparses', true);
  check('edit: edited node survives round-trip',
    m2.nodes().some((nd) => m2.str(nd, 'mName') === '测试节点' && m2.nodeActionNo(nd) === 123));
  const node2 = m2.nodes().find((nd) => m2.str(nd, 'mName') === '测试节点')!;
  check('edit: link survives round-trip', m2.linksOf(node2).length === 1);

  m2.snapshot();
  const before = m2.conditions().length;
  m2.deleteCondition(cond.index);
  check('edit: condition deleted', m2.conditions().length === before - 1);
  check('edit: dangling link made unconditional',
    m2.linksOf(node2).every((lk) => m2.getNum(lk, 'mExistCondition') === 0));
  check('edit: validates clean after deletion', m2.validate().length === 0, m2.validate().join('; '));

  m2.undo();
  check('edit: undo restores condition count', m2.conditions().length === before);

  // action/motion node creation (XFsm-compatible processes)
  const m3 = FsmModel.fromBinary(fs.readFileSync(DEPLOYED), 'w3.fsm');
  m3.snapshot();
  const an = m3.newNode('新Action节点', 'action');
  const mn = m3.newNode('新Motion节点', 'motion');
  check('edit: action node ActionNo', m3.nodeActionNo(an) === 0);
  check('edit: motion node MotionNo', m3.nodeMotionNo(mn)?.motion === 0 && m3.nodeMotionNo(mn)?.phase === -1);
  const anProc = m3.processesOf(an)[0];
  const mnProc = m3.processesOf(mn)[0];
  check('edit: action container name', m3.str(anProc, 'mContainerName') === 'Action_W03', m3.str(anProc, 'mContainerName'));
  check('edit: motion container name', m3.str(mnProc, 'mContainerName') === 'LinkMotion_W03', m3.str(mnProc, 'mContainerName'));
  const rt = FsmModel.fromBinary(m3.toBinary(), 'rt3.fsm');
  const rtAn = rt.nodes().find((nd) => rt.str(nd, 'mName') === '新Action节点')!;
  const rtMn = rt.nodes().find((nd) => rt.str(nd, 'mName') === '新Motion节点')!;
  check('edit: action/motion survive round-trip',
    rt.nodeActionNo(rtAn) === 0 && rt.nodeMotionNo(rtMn)?.motion === 0);
  check('edit: validates clean after node creation', rt.validate().length === 0, rt.validate().join('; '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
