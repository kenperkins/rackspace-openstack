# v0.0.10#
- Adding preliminary support for Cloud Databases [Andrew Regner](https://github.com/adregner)

# v0.0.9 #
- Minor change to support `npm test`

# v0.0.8 #
- First integration of CloudBlockStorage functionality

# v0.0.7 #
- Minor fix to support a max timeout on server creation

# v0.0.6 #
- Added createServerWithWait functions
- Various bug fixes in cloudDns wrapper
- Added preliminary support for winston logging

# v0.0.5 #
- Fixed a bug in package.json to rename include

# v0.0.4 #
- Adding support for Rackspace Cloud LoadBalancers
    - New built-in types for LoadBalancer, Node, VirtualIp
    - Full support for API (sans metadata)
        - SSL Termination
        - Logging
        - Session
        - Algorithms
        - Health Monitoring
        - Batch operations (add/remove/update nodes, vips, access list, etc)
- Not Supported:
    - Pagination APIs
    - Metadata

# v0.0.3 #
- Adding support for CloudDns
    - Three new types: Domain, Record, and Status
    - built in promise support on addRecords, updateRecords, and deleteRecords

# v0.0.1 #
- first stable version
- implemented most basic functions for Open Stack Servers
