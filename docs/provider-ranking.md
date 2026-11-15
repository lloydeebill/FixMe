# Pilot provider suggestions

The three pilot-area keys and labels, and the 50 km distance range, live in `config/pilot_areas.php`. Providers select every area they serve in registration or Profile. An unset `service_areas` value means the provider has not opted into any pilot area; editing the profile lets an existing provider choose coverage. Certificates and reviews do not affect eligibility or score.

For a chosen catalog category and job area, Laravel first keeps only providers linked to that active category and serving that area. The client can still browse and choose a different provider. Scanner and Planner category suggestions enter the same Services view and use this same endpoint.

When both the client's **chosen job pin** and the provider's saved service pin exist, straight-line distance is the Haversine distance in kilometres. The fixed score is:

`60 × max(0, 1 − distance_km / 50) + (requested slot available ? 40 : 0)`

The score is between 0 and 100. A distance of 50 km or more earns zero distance points. If no date and time are selected, availability is **not assessed** and adds zero points; the maximum possible score then is 60. A selected slot is available only when it is in the future, within the provider's configured working day and hours, and has no confirmed booking at the same start time. This follows the app's start-time conflict rule; it does not claim full duration overlap prevention. Times use the app's Asia/Manila timezone.

If either pin is missing, distance is **unavailable** and adds zero points. Providers with a calculable distance sort first, by score and then distance. Unknown-distance providers sort by assessed availability points, then display name and profile ID; without a selected time, that is name and ID order. The UI does not invent a distance or an availability result.

New bookings require an explicitly chosen job area, address, and pin. The saved account location is only an optional starting point that the client must select and may adjust on the map. Historical bookings are not backfilled from current account coordinates; when a job pin was never stored, booking details say “Service location pin unavailable.”
