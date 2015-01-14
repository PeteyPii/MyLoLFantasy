import os
import json
import sys


def query_yes_no(question, default="yes"):
    valid = {"yes": True, "y": True, "ye": True, "no": False, "n": False}
    if default is None:
      prompt = " [y/n] "
    elif default == "yes":
      prompt = " [Y/n] "
    elif default == "no":
      prompt = " [y/N] "
    else:
      raise ValueError("invalid default answer: '{}'".format(default))

    while True:
      sys.stdout.write(question + prompt)
      choice = input().lower()
      if default is not None and choice == "":
        return valid[default]
      elif choice in valid:
        return valid[choice]
      else:
          sys.stdout.write("Please respond with 'yes' or 'no' (or 'y' or 'n').\n")


# Returns (settings, success, error_msg)
def get_settings():
  if os.path.isfile("settings.json"):
    with open("settings.json", "r") as fr:
      settings = json.load(fr)

      if "lol-api-key" not in settings or not settings["lol-api-key"]:
        error_msg = "LoL API key is not configured correctly. Set 'lol-api-key' to your key, including the dashes"
      elif "session-key" not in settings or len(settings["session-key"]) != 24:
        error_msg = "Secret session key is not configured correctly. Set 'session-key' to a secret 24-item list of integers with values between 0-255"
      elif "refresh-period" not in settings:
        error_msg = "Stat refresh period is not configured correctly. Set 'refresh-period' to a period in seconds for how often to refresh statistics"
      else:
        # Make sure session key has appropriate values
        good_key = True
        for x in settings["session-key"]:
          if x < 0 or x > 255:
            good_key = False

        if good_key:
          # Make sure the stat refresh period is a valid floating point time value
          try:
            x = float(settings["refresh-period"])
            if x < 0:
              error_msg = "Refresh period should be non-negative"
            else:
              return settings, True, ""
          except ValueError:
            error_msg = "Refresh period is not a number"
        else:
          error_msg = "Secret session key is not configured correctly. Set 'session-key' to a secret 24-item list of integers with values between 0-255"
  else:
    error_msg = "Settings file 'settings.json' not found"

  return {}, False, error_msg


# Generate a settings file semi-intelligently when run independently
if __name__ == "__main__":
  with open("settings.json", "w") as fw:
    settings = {}
    settings["lol-api-key"] = None
    settings["session-key"] = None
    settings["refresh-period"] = 3600

    if query_yes_no("Enter your LoL API key?"):
      settings["lol-api-key"] = input().strip().lower()

    if query_yes_no("Generate a secret session key automatically?"):
      settings["session-key"] = [x for x in os.urandom(24)]

    json.dump(settings, fw)
