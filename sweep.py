import sys

f = open(sys.argv[1], 'r')

# Holds a protobuf object
thisBlock = []

# Are we currently examining a protobuf Object?
examiningBlock = False

enum = False

# Object definitions that are deprecated
deprecatedObjects = []
deprecatedFields = []

for line in f:

    #  Block has ended. Check it .
    if '}' in line:
        examiningBlock = False

        for field in thisBlock:
            if '_count' in field:
                index = field.find('_count')

                # found a <name>_count field
                # extract <name> and look for it in this object
                target = field[0:index]

                for field2 in thisBlock:
                    if target == field2:
                        print '"' + target + '" and "' + target + '_count" fields found in ' + blockName + '. Please rename "' +target + '_count" to "' + target + '_total"'
                        exit(1)
        thisBlock = []

    # We're still building this protobuf object
    # Append the next field
    if examiningBlock:

        if '[deprecated=true]' in line and not(enum):
            line = line.strip()
            start = line.count('optional')

            fieldName = line[0:line.index('=')]
            deprecatedFields.append(blockName + '.' + fieldName)

        # segments = line.split()

        # if len(segments) > 2:
        #     thisBlock.append(segments[2])
        #     print segments[2]

    # New block,
    # start building the object
    if '{' in line:
        # regex to find  enum MessageType {
        # also find if that line itself is deprecated
        examiningBlock = True
        blockName = line[line.index(' ') + 1:line.index(' {')]

        if 'enum' in line:
            enum = True
        else:
            enum = False

        if '[deprecated=true]' in line:
            deprecatedObjects.append(blockName)


print 'OBJECTS'

# for item in deprecatedObjects:
#     print item

print 'FIELDS'

for item in deprecatedFields:
    print item
print deprecatedFields

# no errors found
exit(0)
