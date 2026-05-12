# Yandex.Cloud Docker machine driver
## Overview

![Test](https://github.com/yandex-cloud/docker-machine-driver-yandex/actions/workflows/test.yml/badge.svg)

A 3rd-party driver plugin for Docker machine to manage your containers on the servers of Yandex.Cloud

## Installation
### From a Release

The latest version of the `docker-machine-driver-yandex` binary is available on the
[GithHub Releases](https://github.com/yandex-cloud/docker-machine-driver-yandex/releases) page.
Download the the binary that corresponds to your OS into a directory residing in your PATH.

### From Source

Make sure you have installed [Go](http://www.golang.org) and configured [GOPATH](http://golang.org/doc/code.html#GOPATH)
properly. For MacOS and Linux, make sure `$GOPATH/bin` is part of your `$PATH` for MacOS and Linux.
For Windows, make sure `%GOPATH%\bin` is included in `%PATH%`.

Run the following command:
```shell
$ go get -u github.com/yandex-cloud/docker-machine-driver-yandex
```

## Usage
```bash
$ docker-machine create \
  --driver yandex \
  --yandex-token=<your_iam_token_here> \
  default
```

## Options

If you haven't specified yc-token nor yc-service-account-key-file it will try to get Instance Service Account.

- `--yandex-cloud-id`: Cloud ID
- `--yandex-cores`: Count of virtual CPUs
- `--yandex-core-fraction`: Core fraction
- `--yandex-disk-size`: Disk size in gigabytes
- `--yandex-disk-type`: Disk type, e.g. 'network-hdd'
- `--yandex-endpoint`: Yandex.Cloud API Endpoint
- `--yandex-folder-id`: Folder ID
- `--yandex-image-family`: Image family name to lookup image ID for instance
- `--yandex-image-folder-id`: Folder ID to the latest image by family name
- `--yandex-image-id`: User-defined Image ID
- `--yandex-labels`: Instance labels in 'key=value' format
- `--yandex-memory`: Memory in gigabytes
- `--yandex-nat`: Assign external (NAT) IP address
- `--yandex-platform-id`: ID of the hardware platform configuration
- `--yandex-preemptible`: Yandex.Cloud Instance preemptibility flag
- `--yandex-sa-key-file`: Yandex.Cloud Service Account key file
- `--yandex-sa-key`: Yandex.Cloud Service Account key (inline JSON body, alternative to `--yandex-sa-key-file`)
- `--yandex-sa-id`: Service account ID to attach to the instance
- `--yandex-security-groups`: Set security groups
- `--yandex-ssh-port`: SSH port
- `--yandex-ssh-user`: SSH username
- `--yandex-static-address`: Set public static IPv4 address
- `--yandex-subnet-id`: Subnet ID
- `--yandex-token`: Yandex.Cloud OAuth token or IAM token
- `--yandex-use-internal-ip`: Use the internal Instance IP to communicate
- `--yandex-userdata`: Path to file with cloud-init user-data
- `--yandex-zone`: Yandex.Cloud zone
- `--yandex-fs`: Filesystem to attach to the instance. Format 'mountPath=FilesystemID'
- `--yandex-rke2-prep`: Prepare the instance for RKE2: disable swap and open RKE2 ports if ufw is active

#### Environment variables and default values

| CLI option                 | Environment variable | Default Value            |
|----------------------------|----------------------|--------------------------|
| `--yandex-cloud-id`        | YC_CLOUD_ID          |                          |
| `--yandex-cores`           | YC_CORES             | 2                        |
| `--yandex-core-fraction`   | YC_CORE_FRACTION     | 100                      |
| `--yandex-disk-size`       | YC_DISK_SIZE         | 20                       |
| `--yandex-disk-type`       | YC_DISK_TYPE         | network-hdd              |
| `--yandex-endpoint`        | YC_ENDPOINT          | api.cloud.yandex.net:443 |
| `--yandex-folder-id`       | YC_FOLDER_ID         |                          |
| `--yandex-image-family`    | YC_IMAGE_FAMILY      | ubuntu-1604-lts          |
| `--yandex-image-folder-id` | YC_IMAGE_FOLDER_ID   | standard-images          |
| `--yandex-image-id`        | YC_IMAGE_ID          |                          |
| `--yandex-labels`          | YC_LABELS            |                          |
| `--yandex-memory`          | YC_MEMORY            | 1                        |
| `--yandex-nat`             | YC_NAT               | false                    |
| `--yandex-platform-id`     | YC_PLATFORM_ID       | standard-v1              |
| `--yandex-preemptible`     | YC_PREEMPTIBLE       | false                    |
| `--yandex-sa-key-file`     | YC_SA_KEY_FILE       |                          |
| `--yandex-sa-key`          | YC_SA_KEY            |                          |
| `--yandex-sa-id`           | YC_SA_ID             |                          |
| `--yandex-security-groups` | YC_SECURITY_GROUPS   |                          |
| `--yandex-ssh-port`        | YC_SSH_PORT          | 22                       |
| `--yandex-ssh-user`        | YC_SSH_USER          | yc-user                  |
| `--yandex-static-address`  | YC_STATIC_ADDRESS    |                          |
| `--yandex-subnet-id`       | YC_SUBNET_ID         |                          |
| `--yandex-token`           | YC_TOKEN             |                          |
| `--yandex-use-internal-ip` | YC_USE_INTERNAL_IP   | false                    |
| `--yandex-userdata`        | YC_USERDATA          |                          |
| `--yandex-zone`            | YC_ZONE              | ru-central1-a            |
| `--yandex-fs`              | YC_FS                |                          |
| `--yandex-rke2-prep`       | YC_RKE2_PREP         | false                    |

## Use with Rancher (RKE2 node driver)

This driver can be registered with Rancher 2.13 / 2.14 as a custom node
driver to provision Yandex.Cloud VMs for RKE2 clusters. A companion
single-file Ember UI lives in [`ui/component.js`](ui/component.js); it
renders the form Rancher shows when a user creates a node template.

In the Rancher UI go to **Cluster Management → Drivers → Node Drivers
→ Add Node Driver** and fill in:

- **Download URL** — the Linux binary from the matching GitHub release,
  e.g. `https://github.com/yandex-cloud/docker-machine-driver-yandex/releases/download/vX.Y.Z/docker-machine-driver-yandex_X.Y.Z_linux_amd64.tar.gz`
- **Custom UI URL** — the raw URL of `ui/component.js` at the same tag,
  e.g. `https://raw.githubusercontent.com/yandex-cloud/docker-machine-driver-yandex/vX.Y.Z/ui/component.js`
- **Checksum** — paste the matching SHA256 from
  `docker-machine-driver-yandex_X.Y.Z_SHA256SUMS` (also attached to the
  release).
- **Whitelist Domains** — `raw.githubusercontent.com` (or wherever the
  UI is hosted).

The UI defaults `nat=true` and `rke2Prep=true` so that a newly created
node is reachable from the Rancher server and that the cloud-init prep
needed for RKE2 (swap-off and a conditional `ufw allow` block for the
RKE2 control-plane / agent / NodePort / VXLAN ports) is applied at
first boot. Both are toggleable in the form.

For credentials, the form offers a radio between an OAuth/IAM token
and a pasted Service Account Key JSON. The latter is wired to the new
`--yandex-sa-key` flag, since Rancher cannot stage a file on the
server-side filesystem for `--yandex-sa-key-file` to read.

---