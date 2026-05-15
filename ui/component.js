/*!
 * Rancher node-driver UI for docker-machine-driver-yandex.
 *
 * Single-file Ember (AMD) bundle registered with Rancher under the
 * NodeDriver `uiUrl` field. Targets Rancher 2.13 / 2.14, which still
 * loads node-driver edit forms via the legacy `component.js` pattern
 * (the Vue Dashboard delegates the node-driver form to the cluster
 * manager UI).
 *
 * The form is laid out in sections with a collapsible "Advanced" tail.
 * Required-ish fields (credentials, folder/zone, image, instance spec,
 * NAT, subnet) are visible by default; the long tail of advanced flags
 * lives under the Advanced toggle.
 */
!(function () {
  'use strict';

  var Ember = window.Ember;
  var get = Ember.get;
  var set = Ember.set;
  var computed = Ember.computed;

  define('nodes/components/driver-yandex/component', [
    'exports',
    'shared/components/node/driver-cru-node'
  ], function (exports, driverCruNode) {
    Object.defineProperty(exports, '__esModule', { value: true });

    exports.default = driverCruNode.default.extend({
      driverName: 'yandex',
      needAPIToken: false,
      config: computed.alias('model.yandexConfig'),

      // UI state
      authType: 'token',
      showAdvanced: false,

      bootstrap: function () {
        var store = get(this, 'globalStore');
        var config = store.createRecord({
          type: 'yandexConfig',

          // Credentials (one of token | saKey is required; saKeyFile is
          // not exposed in the UI — Rancher cannot stage a file path on
          // the server-side filesystem for the driver to read).
          token: '',
          saKey: '',

          // Location
          cloudId: '',
          folderId: '',
          zone: 'ru-central1-a',
          subnetId: '',

          // Image
          imageFamily: 'ubuntu-2004-lts',
          imageFolderId: 'standard-images',
          imageId: '',
          platformId: 'standard-v1',

          // Compute
          cores: 2,
          coreFraction: 100,
          memory: 1,
          diskSize: 20,
          diskType: 'network-hdd',

          // Network — DECISIONS.md Q4 Sub-B.2: the UI defaults NAT on so
          // a Rancher-provisioned node is reachable from the Rancher
          // server out of the box. Users can still uncheck it.
          nat: true,
          preemptible: false,
          useInternalIp: false,
          staticAddress: '',
          securityGroups: [],

          // Misc / Advanced
          labels: [],
          endpoint: 'api.cloud.yandex.net:443',
          sshUser: 'ubuntu',
          sshPort: 22,
          saId: '',
          fs: [],

          // RKE2 prep — DECISIONS.md Q4 Sub-A.2: checkbox in Advanced,
          // default checked. Driver-side flag is opt-in; the UI flips
          // it on so the default Rancher RKE2 path "just works".
          rke2Prep: true,

          // RKE2 suppress external IP — DECISIONS.md Q5: default on
          // so Rancher's RKE2 planner doesn't promote the public NAT
          // IP into --node-external-ip (which would make kube-apiserver
          // advertise the un-hairpinnable public IP). Toggleable for
          // non-RKE2 use cases.
          rke2SuppressExternalIp: true
        });

        set(this, 'model.yandexConfig', config);
      },

      // Round-trip the StringSlice fields between the array form (what
      // the Go driver consumes via mcnflag.StringSliceFlag) and a
      // newline-joined string (what the textarea shows the user).
      labelsString: computed('config.labels.[]', {
        get: function () {
          return (get(this, 'config.labels') || []).join('\n');
        },
        set: function (key, value) {
          set(this, 'config.labels', splitLines(value));
          return value;
        }
      }),

      securityGroupsString: computed('config.securityGroups.[]', {
        get: function () {
          return (get(this, 'config.securityGroups') || []).join('\n');
        },
        set: function (key, value) {
          set(this, 'config.securityGroups', splitLines(value));
          return value;
        }
      }),

      fsString: computed('config.fs.[]', {
        get: function () {
          return (get(this, 'config.fs') || []).join('\n');
        },
        set: function (key, value) {
          set(this, 'config.fs', splitLines(value));
          return value;
        }
      }),

      isTokenAuth: computed('authType', function () {
        return get(this, 'authType') === 'token';
      }),
      isSaKeyAuth: computed('authType', function () {
        return get(this, 'authType') === 'saKey';
      }),

      actions: {
        toggleAdvanced: function () {
          this.toggleProperty('showAdvanced');
        },

        setAuthType: function (value) {
          set(this, 'authType', value);
          // Clear the unused field so we never pass both to the driver.
          if (value === 'token') {
            set(this, 'config.saKey', '');
          } else {
            set(this, 'config.token', '');
          }
        }
      },

      validate: function () {
        this._super.apply(this, arguments);

        var errors = get(this, 'errors') || [];
        var config = get(this, 'config');
        var authType = get(this, 'authType');

        if (authType === 'token') {
          if (!get(config, 'token')) {
            errors.push('OAuth or IAM Token is required.');
          }
        } else {
          var saKey = get(config, 'saKey');
          if (!saKey) {
            errors.push('Service Account Key JSON is required.');
          } else {
            try {
              JSON.parse(saKey);
            } catch (e) {
              errors.push('Service Account Key must be valid JSON.');
            }
          }
        }

        if (!get(config, 'folderId') && !get(config, 'cloudId')) {
          errors.push('Either Folder ID or Cloud ID is required.');
        }
        if (!get(config, 'zone')) {
          errors.push('Zone is required.');
        }
        if (parseInt(get(config, 'cores'), 10) < 1) {
          errors.push('Cores must be at least 1.');
        }
        if (parseInt(get(config, 'memory'), 10) < 1) {
          errors.push('Memory (GB) must be at least 1.');
        }
        if (parseInt(get(config, 'diskSize'), 10) < 10) {
          errors.push('Disk size must be at least 10 GB.');
        }
        var sshPort = parseInt(get(config, 'sshPort'), 10);
        if (sshPort < 1 || sshPort > 65535) {
          errors.push('SSH port must be between 1 and 65535.');
        }

        set(this, 'errors', errors);
        return errors.length === 0;
      }
    });
  });

  function splitLines(value) {
    return (value || '')
      .split('\n')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  define('nodes/components/driver-yandex/template', ['exports'], function (exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.default = Ember.HTMLBars.compile(
      '<section class="horizontal-form">\n' +
      '  <h3>Credentials</h3>\n' +
      '  <div class="row">\n' +
      '    <div class="col span-12">\n' +
      '      <label class="acc-label">Authentication</label>\n' +
      '      <div class="radio">\n' +
      '        <label>\n' +
      '          <input type="radio" name="auth-yandex" value="token" onclick={{action "setAuthType" "token"}} checked={{isTokenAuth}}>\n' +
      '          OAuth / IAM Token\n' +
      '        </label>\n' +
      '        <label class="ml-15">\n' +
      '          <input type="radio" name="auth-yandex" value="saKey" onclick={{action "setAuthType" "saKey"}} checked={{isSaKeyAuth}}>\n' +
      '          Service Account Key (JSON)\n' +
      '        </label>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  {{#if isTokenAuth}}\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <label class="acc-label">Token <span class="text-danger">*</span></label>\n' +
      '        {{input type="password" class="form-control" value=config.token autocomplete="off" placeholder="Paste your Yandex.Cloud OAuth or IAM (t1.*) token"}}\n' +
      '        <p class="help-block">An OAuth token from oauth.yandex.com or an IAM token (starts with <code>t1.</code>).</p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  {{else}}\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <label class="acc-label">Service Account Key (JSON) <span class="text-danger">*</span></label>\n' +
      '        {{textarea class="form-control" rows="8" value=config.saKey autocomplete="off" placeholder="Paste the full JSON key generated by `yc iam key create ...`"}}\n' +
      '        <p class="help-block">The same document a CLI user would pass via <code>--yandex-sa-key-file</code>.</p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  {{/if}}\n' +
      '\n' +
      '  <hr class="over-hr">\n' +
      '  <h3>Location</h3>\n' +
      '  <div class="row">\n' +
      '    <div class="col span-6">\n' +
      '      <label class="acc-label">Folder ID</label>\n' +
      '      {{input type="text" class="form-control" value=config.folderId placeholder="b1g…"}}\n' +
      '      <p class="help-block">Required unless Cloud ID is set (then the driver will pick a folder).</p>\n' +
      '    </div>\n' +
      '    <div class="col span-6">\n' +
      '      <label class="acc-label">Cloud ID</label>\n' +
      '      {{input type="text" class="form-control" value=config.cloudId placeholder="b1g… (optional, used only if Folder ID is empty)"}}\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="row">\n' +
      '    <div class="col span-6">\n' +
      '      <label class="acc-label">Zone <span class="text-danger">*</span></label>\n' +
      '      {{input type="text" class="form-control" value=config.zone placeholder="ru-central1-a"}}\n' +
      '    </div>\n' +
      '    <div class="col span-6">\n' +
      '      <label class="acc-label">Subnet ID</label>\n' +
      '      {{input type="text" class="form-control" value=config.subnetId placeholder="Leave blank to auto-pick a subnet in the chosen zone"}}\n' +
      '    </div>\n' +
      '  </div>\n' +
      '\n' +
      '  <hr class="over-hr">\n' +
      '  <h3>Image</h3>\n' +
      '  <div class="row">\n' +
      '    <div class="col span-6">\n' +
      '      <label class="acc-label">Image family</label>\n' +
      '      {{input type="text" class="form-control" value=config.imageFamily placeholder="ubuntu-2004-lts"}}\n' +
      '    </div>\n' +
      '    <div class="col span-6">\n' +
      '      <label class="acc-label">Platform ID</label>\n' +
      '      {{input type="text" class="form-control" value=config.platformId placeholder="standard-v1"}}\n' +
      '    </div>\n' +
      '  </div>\n' +
      '\n' +
      '  <hr class="over-hr">\n' +
      '  <h3>Instance spec</h3>\n' +
      '  <div class="row">\n' +
      '    <div class="col span-3">\n' +
      '      <label class="acc-label">Cores</label>\n' +
      '      {{input type="number" class="form-control" value=config.cores min="1"}}\n' +
      '    </div>\n' +
      '    <div class="col span-3">\n' +
      '      <label class="acc-label">Memory (GB)</label>\n' +
      '      {{input type="number" class="form-control" value=config.memory min="1"}}\n' +
      '    </div>\n' +
      '    <div class="col span-3">\n' +
      '      <label class="acc-label">Disk size (GB)</label>\n' +
      '      {{input type="number" class="form-control" value=config.diskSize min="10"}}\n' +
      '    </div>\n' +
      '    <div class="col span-3">\n' +
      '      <label class="acc-label">Disk type</label>\n' +
      '      {{input type="text" class="form-control" value=config.diskType placeholder="network-hdd"}}\n' +
      '    </div>\n' +
      '  </div>\n' +
      '\n' +
      '  <hr class="over-hr">\n' +
      '  <h3>Network</h3>\n' +
      '  <div class="row">\n' +
      '    <div class="col span-6">\n' +
      '      <label class="checkbox">\n' +
      '        {{input type="checkbox" checked=config.nat}}\n' +
      '        Assign an external (NAT) IPv4 address\n' +
      '      </label>\n' +
      '      <p class="help-block">On unless Rancher itself runs inside the same VPC and can reach the private IP.</p>\n' +
      '    </div>\n' +
      '    <div class="col span-6">\n' +
      '      <label class="checkbox">\n' +
      '        {{input type="checkbox" checked=config.useInternalIp}}\n' +
      '        Reach the node via its internal IP\n' +
      '      </label>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '\n' +
      '  <hr class="over-hr">\n' +
      '  <div class="row">\n' +
      '    <div class="col span-12">\n' +
      '      <button type="button" class="btn bg-transparent text-link p-0" onclick={{action "toggleAdvanced"}}>\n' +
      '        {{#if showAdvanced}}Hide Advanced{{else}}Show Advanced{{/if}}\n' +
      '      </button>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '\n' +
      '  {{#if showAdvanced}}\n' +
      '    <hr class="over-hr">\n' +
      '    <h4>Advanced</h4>\n' +
      '\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <label class="checkbox">\n' +
      '          {{input type="checkbox" checked=config.rke2Prep}}\n' +
      '          Prepare the instance for RKE2 (disable swap; open RKE2 ports if ufw is active)\n' +
      '        </label>\n' +
      '        <p class="help-block">Leave on for any node Rancher will turn into an RKE2 server or agent. Off for non-RKE2 use.</p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <label class="checkbox">\n' +
      '          {{input type="checkbox" checked=config.rke2SuppressExternalIp}}\n' +
      '          Hide external (NAT) IP from RKE2 (avoid public --node-external-ip)\n' +
      '        </label>\n' +
      '        <p class="help-block">Stops Rancher\'s RKE2 planner from passing the public NAT IP into <code>--node-external-ip</code>, so kube-apiserver advertises the internal IP. SSH-from-Rancher still uses the public IP. Off for non-RKE2 use.</p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '\n' +
      '    <div class="row">\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">API endpoint</label>\n' +
      '        {{input type="text" class="form-control" value=config.endpoint placeholder="api.cloud.yandex.net:443"}}\n' +
      '      </div>\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Image folder ID</label>\n' +
      '        {{input type="text" class="form-control" value=config.imageFolderId placeholder="standard-images"}}\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="row">\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Image ID override</label>\n' +
      '        {{input type="text" class="form-control" value=config.imageId placeholder="Leave blank to look up by family"}}\n' +
      '      </div>\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Core fraction (%)</label>\n' +
      '        {{input type="number" class="form-control" value=config.coreFraction min="5" max="100"}}\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="row">\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Service Account ID (attached to instance)</label>\n' +
      '        {{input type="text" class="form-control" value=config.saId}}\n' +
      '      </div>\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Static external address</label>\n' +
      '        {{input type="text" class="form-control" value=config.staticAddress placeholder="Leave blank for a dynamic NAT IP"}}\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <label class="checkbox">\n' +
      '          {{input type="checkbox" checked=config.preemptible}}\n' +
      '          Preemptible instance\n' +
      '        </label>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '\n' +
      '    <div class="row">\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">SSH user</label>\n' +
      '        {{input type="text" class="form-control" value=config.sshUser placeholder="ubuntu"}}\n' +
      '      </div>\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">SSH port</label>\n' +
      '        {{input type="number" class="form-control" value=config.sshPort min="1" max="65535"}}\n' +
      '      </div>\n' +
      '    </div>\n' +
      '\n' +
      '    <div class="row">\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Security group IDs (one per line)</label>\n' +
      '        {{textarea class="form-control" rows="3" value=securityGroupsString placeholder="enpa…\\nenpb…"}}\n' +
      '      </div>\n' +
      '      <div class="col span-6">\n' +
      '        <label class="acc-label">Labels (one <code>key=value</code> per line)</label>\n' +
      '        {{textarea class="form-control" rows="3" value=labelsString placeholder="env=prod\\nteam=platform"}}\n' +
      '      </div>\n' +
      '    </div>\n' +
      '\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <label class="acc-label">Filesystems (one <code>mountPath=FilesystemID</code> per line)</label>\n' +
      '        {{textarea class="form-control" rows="3" value=fsString placeholder="/mnt/data=fs-xxxxxxxx"}}\n' +
      '        <p class="help-block">Mounted via virtio-fs at first boot; the device name is the last path segment.</p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  {{/if}}\n' +
      '\n' +
      '  {{#if errors}}\n' +
      '    <div class="row">\n' +
      '      <div class="col span-12">\n' +
      '        <div class="banner bg-error">\n' +
      '          <ul class="mb-0">\n' +
      '            {{#each errors as |err|}}\n' +
      '              <li>{{err}}</li>\n' +
      '            {{/each}}\n' +
      '          </ul>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  {{/if}}\n' +
      '</section>\n'
    );
  });
}).call(this);
