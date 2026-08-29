"""Parse the HSPSE IMOS CurrentOrganization export into PMG Compass config.
No data leaves the machine. Emits, to ./out/:
  - AREAS.csv           (Zone, District, Area)  -- teaching areas only
  - roster.tsv          (full roster + blank Email column to fill)
  - LEADERSHIP.csv      (ZL/DL/STL/AP + blank Email column)
  - hspsem_areas_rows.txt   (HSPSEM_AREAS_ROWS JS literal for HspsemData.gs)
  - anomalies.txt
"""
import sys, os, csv, json
sys.stdout.reconfigure(encoding="utf-8")
import pandas as pd

SRC = r"C:\Users\2011794-MTS\Downloads\CurrentOrganization-Excel (4).xls"
OUT = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT, exist_ok=True)

# Position code -> (role, is_senior). Senior = whose email becomes the area mailbox.
ROLE = {
    "ZL1": ("Zone Leader", True),      "ZL2": ("Zone Leader", False),
    "STL1": ("Sister Training Leader", True), "STL2": ("Sister Training Leader", False),
    "DL": ("District Leader", True),
    "DT": ("District Leader", True),   # DT = district leader (also training); 13 DL + 14 DT = 27 districts
    "TR": ("Trainer", True),
    "SC": ("Senior Companion", True),
    "JC": ("Junior Companion", False),
    "SA": ("Service / unassigned", False),
    "AP": ("Assistant to the President", True),
}
LEADER_CODES = {"ZL1", "ZL2", "STL1", "STL2", "DL", "DT", "AP"}
SERVICE_ZONE = "Misioneros de Servicio"

raw = pd.read_excel(SRC, header=None)
hdr = raw.index[raw.apply(lambda r: (r == "Zone").any(), axis=1)][0]
df = pd.read_excel(SRC, header=hdr)
df.columns = [str(c).strip() for c in df.columns]
df = df.dropna(subset=["Area"]).copy()
df = df[df["Zone"].astype(str).str.strip() != "Confidential - For Church Use Only"]
for c in ["Zone", "District", "Area", "Name", "Position"]:
    df[c] = df[c].astype(str).str.strip()
df["code"] = df["Position"].str.strip("()")
df["ReleaseDate"] = df["Release Date"].astype(str).str[:10]
df["MID"] = df["Missionary ID"].astype(str).str.replace(r"\.0$", "", regex=True)

teach = df[df["Zone"] != SERVICE_ZONE].copy()

# ---- AREAS.csv (unique Zone/District/Area, teaching only) ----
areas = (teach[["Zone", "District", "Area"]].drop_duplicates()
         .sort_values(["Zone", "District", "Area"]))
areas.to_csv(os.path.join(OUT, "AREAS.csv"), index=False)

# ---- roster.tsv (every teaching missionary, Email blank) ----
rows = []
for _, r in teach.sort_values(["Zone", "District", "Area", "code"]).iterrows():
    role, senior = ROLE.get(r["code"], ("?", False))
    rows.append([r["Zone"], r["District"], r["Area"], r["Name"], r["code"], role,
                 "Companion1" if senior else "Companion2", "", r["MID"], r["ReleaseDate"]])
with open(os.path.join(OUT, "roster.tsv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["Zone", "District", "Area", "Name", "Code", "Role", "CompanionSlot",
                "Email_TO_FILL", "MissionaryID", "ReleaseDate"])
    w.writerows(rows)

# ---- LEADERSHIP.csv ----
lead = teach[teach["code"].isin(LEADER_CODES)].copy()
with open(os.path.join(OUT, "LEADERSHIP.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Name", "Calling", "Zone", "District", "Area", "Email_TO_FILL",
                "Gets_Nightly_Report_TO_CONFIRM"])
    for _, r in lead.sort_values(["Zone", "code"]).iterrows():
        role = ROLE.get(r["code"], ("?", False))[0]
        w.writerow([r["Name"], role, r["Zone"], r["District"], r["Area"], "", ""])

# ---- HSPSEM_AREAS_ROWS JS literal ----
lit = ["var HSPSEM_AREAS_ROWS = ["]
for _, r in areas.iterrows():
    lit.append("  ['%s', '%s']," % (r["Zone"].replace("'", "\\'"), r["Area"].replace("'", "\\'")))
lit.append("];")
open(os.path.join(OUT, "hspsem_areas_rows.txt"), "w", encoding="utf-8").write("\n".join(lit))

# ---- HSPSEM_MISSION_ORG_ROWS (modeled on CCSM_MISSION_ORG_ROWS) ----
# Header: Area_Code, Area_Name, Zone, District, Companion1_Name, Companion1_Email,
#         Companion2_Name, Companion2_Email, Is_DL, Is_ZL, Is_STL, Is_AP, Is_MP, Active
SENIOR = {"SC", "DL", "DT", "TR", "ZL1", "STL1", "AP"}  # -> Companion1 slot
mo = []
code = 0
for (z, d, a), g in teach.groupby(["Zone", "District", "Area"], sort=True):
    code += 1
    g = g.copy()
    g["rank"] = g["code"].apply(lambda c: 0 if c in SENIOR else 1)
    g = g.sort_values(["rank", "Name"])
    names = list(g["Name"])
    c1 = names[0]
    c2 = " / ".join(names[1:]) if len(names) > 1 else ""
    codes = set(g["code"])
    tf = lambda b: "TRUE" if b else "FALSE"
    mo.append([
        "A%03d" % code, a, z, d,
        c1, "", c2, "",
        tf(codes & {"DL", "DT"}), tf(codes & {"ZL1", "ZL2"}),
        tf(codes & {"STL1", "STL2"}), tf("AP" in codes), "FALSE", "TRUE",
    ])
ml = ["var HSPSEM_MISSION_ORG_ROWS = ["]
for r in mo:
    ml.append(" [" + ", ".join('"%s"' % str(x).replace('"', '\\"') for x in r) + "],")
ml[-1] = ml[-1].rstrip(",")
ml.append("];")
open(os.path.join(OUT, "hspsem_mission_org_rows.txt"), "w", encoding="utf-8").write("\n".join(ml))
print("\nMISSION_ORG rows:", len(mo), "(emails blank, like CCSM's data file — fill in the live sheet)")

# ---- ZONES list (dropdown order = alphabetical; reorder to taste) ----
zlist = sorted(areas["Zone"].unique())
open(os.path.join(OUT, "zones.txt"), "w", encoding="utf-8").write(
    "\n".join(zlist) + "\n\nJS: var HSPSEM_ZONES = " + json.dumps(zlist, ensure_ascii=False) + ";\n")

# ---- anomalies ----
an = []
comp = teach.groupby(["Zone", "District", "Area"]).size()
for (z, d, a), n in comp.items():
    if n != 2:
        who = teach[(teach.Zone == z) & (teach.District == d) & (teach.Area == a)]
        an.append("%s / %s / %s : %d missionaries -> %s" %
                  (z, d, a, n, list(who["Name"] + " " + who["Position"])))
dup_area = areas["Area"].value_counts()
for a, n in dup_area[dup_area > 1].items():
    an.append("DUPLICATE area name across zones: '%s' x%d" % (a, n))
open(os.path.join(OUT, "anomalies.txt"), "w", encoding="utf-8").write("\n".join(an) or "none")

# ---- summary to stdout ----
print("teaching zones:", areas["Zone"].nunique())
print("districts:", teach.groupby(["Zone", "District"]).ngroups)
print("teaching areas:", len(areas))
print("teaching missionaries:", len(teach))
print("service missionaries excluded:", len(df) - len(teach))
print("\nzones + area counts:")
for z, g in areas.groupby("Zone"):
    print("  %-26s %d areas" % (z, len(g)))
print("\nleadership rows:", len(lead))
print(lead["code"].value_counts().to_dict())
print("\nanomalies:")
print(open(os.path.join(OUT, "anomalies.txt"), encoding="utf-8").read())
