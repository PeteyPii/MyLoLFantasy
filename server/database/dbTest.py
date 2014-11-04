import databaseMethods as db


if __name__ == "__main__":
  #db.create_user("Patty", "password", "BasicBananas")
  db.create_group("Patty", "GROUP_NAME", ["BasicBananas", "Wonkeee"])
  db.create_group("Patty", "GROUP_NAME_2", ["BasicBananas", "Pulsefire Annie"])
  groups = db.get_groups_in("Patty")
  # print(groups)
  # for group in groups:
  #   print(db.get_group_name(group))
  #   print(db.get_group_data(group))
