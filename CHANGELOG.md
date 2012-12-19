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
