'use strict';

const assert = require('assert').strict;
const common = require('../common');
const exportEtherpad = require('../../../node/utils/ExportEtherpad');
const padManager = require('../../../node/db/PadManager');
const plugins = require('../../../static/js/pluginfw/plugin_defs');
const readOnlyManager = require('../../../node/db/ReadOnlyManager');

describe(__filename, function () {
  let padId;

  beforeEach(async function () {
    padId = common.randomString();
    assert(!await padManager.doesPadExist(padId));
  });

  describe('exportEtherpadAdditionalContent', function () {
    let hookBackup;

    before(async function () {
      hookBackup = plugins.hooks.exportEtherpadAdditionalContent || [];
      plugins.hooks.exportEtherpadAdditionalContent = [{hook_fn: () => ['custom']}];
    });

    after(async function () {
      plugins.hooks.exportEtherpadAdditionalContent = hookBackup;
    });

    it('exports custom records', async function () {
      const pad = await padManager.getPad(padId);
      await pad.db.set(`custom:${padId}`, 'a');
      const data = await exportEtherpad.getPadRaw(pad.id, null);
      assert.equal(data[`custom:${padId}`], 'a');
    });

    it('export from read-only pad uses read-only ID', async function () {
      const pad = await padManager.getPad(padId);
      const readOnlyId = await readOnlyManager.getReadOnlyId(padId);
      await pad.db.set(`custom:${padId}`, 'a');
      const data = await exportEtherpad.getPadRaw(padId, readOnlyId);
      assert.equal(data[`custom:${readOnlyId}`], 'a');
      assert(!(`custom:${padId}` in data));
    });

    it('does not export records from pad with similar ID', async function () {
      const pad = await padManager.getPad(padId);
      await pad.db.set(`custom:${padId}x`, 'a');
      const data = await exportEtherpad.getPadRaw(pad.id, null);
      assert(!(`custom:${padId}x` in data));
    });
  });
});