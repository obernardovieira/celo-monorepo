import csv
import json

HOUR = 60 * 60
DAY = HOUR * 24
YEAR = DAY * 365
MONTH = YEAR / 12

def constructObject(row):
  grant = {}
  grant["releaseStartTime"] = row[6]
  grant["releaseCliffTime"] = int(row[16].replace(',',''))
  grant["numReleasePeriods"] = 48
  grant["releasePeriod"] = MONTH
  grant["amountReleasedPerPeriod"] = row[31]
  grant["revocable"] = True if row[3] == " Yes " else False
  grant['beneficiary'] = row[0]
  grant["releaseOwner"] = "TBD"
  grant["refundAddress"] = "TBD ASK ASA"
  grant["subjectToLiquidityProvision"] = True
  grant["initialDistributionRatio"] = 1000
  grant["canValidate"] = False
  grant["canVote"] = True
  return grant

with open('nonReserve.csv', newline='') as grants:
  with open('aProtocolNonReserve.json', 'w') as outfile:
    spamreader = csv.reader(grants, delimiter=',')
    result = []
    i = 0
    for row in spamreader:
      if i < 14 or i > 62:
        i += 1
        continue
      result.append(constructObject(row))
      i += 1

    json.dump(result, outfile, indent=2)

  