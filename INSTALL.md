HOW TO INSTALL XCL
===================


# Prerequisites

- Installed sqlcl and configured PATH Variable
- Installed Node Package Manager ( npm ) ( https://nodejs.org/en/download/ ) 


# Install Process

- Download or clone repo
- go to extracted xcl directory using a bash
- do: npm install -g
- type: xcl

HAPPY CODING!

# Troubleshooting

If you got DPI-1047: Cannot locate an Oracle Client library see here (https://oracle.github.io/node-oracledb/doc/api.html#initnodeoracledb)
    - check if you have installed all necessary packages
    for ubuntu users:
        - sudo apt install alien libaio1
        - sudo sh -c 'echo #PATH_TO_CLIENT# > /etc/ld.so.conf.d/oracle.conf'
        - sudo ldconfig
        - set Variable LD_LIBRARY_PATH to #PATH_TO_CLIENT#