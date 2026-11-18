'''
Contains code for visualizing track transformations using telemetry data.
   - rotateMatrix
'''
import numpy as np
import fastf1
import fastf1.plotting
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection


def rotateMatrix(xy, *, angle) -> np.ndarray:
	'''
	rotateMatrix(xy, angle)
	Rotate point(s) around origin of coordinate system by given angle.
	
	:param xy: 1 x 2 or n x 2 array of points to rotate
	:param angle: angle in radians to rotate points by

	:return: rotated points as 1 x 2 or n x 2 array
	'''
	rot_mat = np.array([[np.cos(angle), np.sin(angle)],
						[-np.sin(angle),  np.cos(angle)]])
	return np.matmul(xy, rot_mat)


def plot_track_with_labeled_corners(fig: mpl.figure.Figure, ax: mpl.axes.Axes, session: fastf1.core.Session) -> tuple[tuple[mpl.figure.Figure, mpl.axes.Axes], tuple[mpl.figure.Figure, mpl.axes.Axes]]:

	'''
	plot_track_with_labeled_corners(fig, ax, session)
	Forms track based on fastest lap in circuit (likely ignores pits and safety cars/crashes).
	Returns figure and axis with track layout and labeled corners.

		If fig and ax are not provided, new ones will be created, otherwise the provided ones will be used/rewritten.
		Requires session.load(), cachable
		Gives track without corners as well as track with corners.

	:param fig: matplotlib figure object
	:param ax: matplotlib axis object
	:param session: fastf1 Session object with loaded data, session ~ race weekend

	:return: tuple of [tuple of (figure, axis) with track layout + labeled corners AND (figure, axis) with only labeled corners]
	'''

	# get session-specific info
	lap = session.laps.pick_fastest()
	pos = lap.get_pos_data()
	track = pos.loc[:, ('X', 'Y')].to_numpy()
	circuit_info = session.get_circuit_info()
	location = session.event["Location"]

	if fig is None or ax is None:
		fig, ax = plt.subplots(figsize=(10, 10))
	
	# Convert angle deg --> rad
	track_angle = circuit_info.rotation/180*np.pi

	# Rotate track to align with circuit info and plot track layout
	rotated_track = rotateMatrix(track, angle=track_angle)
	ax.plot(rotated_track[:, 0], rotated_track[:, 1])

	# snapshot of track only
	track_fig, track_ax = plt.subplots(figsize=(10, 10))
	track_ax.plot(rotated_track[:, 0], rotated_track[:, 1])
	track_ax.axis('equal')
	track_ax.set_xticks([]);
	track_ax.set_yticks([])
	track_ax.set_title(f"{location} - Track Only")
	# HIDE the snapshot figure from the notebook output
	plt.close(track_fig) 

	# Offset length chosen to make it look good
	offset_vector = [500, 0] 

	# Iterate over corners
	for _, corner in circuit_info.corners.iterrows():
		# Label Corner
		txt = f"{corner['Number']}{corner['Letter']}"
		
		# Convert angle deg --> rad and rotate by offset angle
		offset_angle = corner['Angle'] / 180 * np.pi
		offset_x, offset_y = rotateMatrix(offset_vector, angle=offset_angle)

		# Add offset to position of corner
		text_x = corner['X'] + offset_x
		text_y = corner['Y'] + offset_y

		# Rotate text position to align with track
		text_x, text_y = rotateMatrix([text_x, text_y], angle=track_angle)

		# Rotate center of corner to align with track
		track_x, track_y = rotateMatrix([corner['X'], corner['Y']], angle=track_angle)

		# Draw circle next to track
		ax.scatter(text_x, text_y, color = "grey", s=140)

		# Draw line from corner to text
		ax.plot([track_x, text_x], [track_y, text_y], color='grey')

		# Print corner number inside circle
		ax.text(text_x, text_y, txt, va='center_baseline', ha='center', size='small', color='white')

	ax.set_title(location)
	ax.set_xticks([])
	ax.set_yticks([])
	ax.axis('equal')

	return (fig, ax), (track_fig, track_ax)


def plot_track_speed_contour(colormap: mpl.colors.Colormap, weekend: fastf1.events.Event, session: fastf1.core.Session, driver: str, lap: fastf1.core.Lap) -> tuple[mpl.figure.Figure, mpl.axes.Axes]:
	'''
	plot_track_speed_contour(colormap, weekend, session, driver, lap)
	Forms track with countour of speed for given driver on given lap.
	Returns figure and axis with track layout and speed contour for given driver.

		Requires session.load(), cachable

	:param colormap: matplotlib colormap object for speed contour
	:param weekend: fastf1 Event object, describes the whole weekend schedule
	:param session: fastf1 Session object with loaded data
	:param driver: driver code string (e.g. 'VER' for Max Verstappen)
	:param lap: fastf1 Lap object for given driver and lap, defaults to fastest lap if None/invalid
	:return: tuple of (figure, axis) with track layout + speed contour
	'''

	year = weekend["EventDate"].year

	if lap is None:
		lap = session.laps.pick_drivers(driver).pick_fastest()

	# Get telemetry data
	x = lap.telemetry['X']
	y = lap.telemetry['Y']
	color = lap.telemetry['Speed']

	# Create line segments for plotting, colored by speed
	points = np.array([x, y]).T.reshape(-1, 1, 2)
	segments = np.concatenate([points[:-1], points[1:]], axis=1)


	# Create a plot with title and adjust some setting to make it look good.
	fig, ax = plt.subplots(sharex=True, sharey=True, figsize=(12, 6.75))
	fig.suptitle(f'{weekend.name} {year} - {driver} - Speed', size=24, y=0.97)
	plt.subplots_adjust(left=0.1, right=0.9, top=0.9, bottom=0.12)
	ax.axis('off')


	# Plot the data itself and create background track line
	ax.plot(lap.telemetry['X'], lap.telemetry['Y'],
			color='black', linestyle='-', linewidth=16, zorder=0)

	# Create continuous norm to map data points --> colors
	norm = plt.Normalize(color.min(), color.max())
	lc = LineCollection(segments, cmap=colormap, norm=norm,
						linestyle='-', linewidth=5)

	# Set colormapping values
	lc.set_array(color)

	# Merge all line segments together
	line = ax.add_collection(lc)


	# Create a color bar as a legend.
	cbaxes = fig.add_axes([0.25, 0.05, 0.5, 0.05])
	normlegend = mpl.colors.Normalize(vmin=color.min(), vmax=color.max())
	legend = mpl.colorbar.ColorbarBase(cbaxes, norm=normlegend, cmap=colormap,
									orientation="horizontal")


	return fig, ax


def plot_speed_traces_with_corner(session: fastf1.core.Session) -> tuple[mpl.figure.Figure, mpl.axes.Axes]:
	'''
	plot_speed_traces_with_corner(session)
	Plot speed for fastest lap across all drivers with corner markers.
	Returns figure and axis with speed trace and corner markers.

		Requires session.load(), cachable

	:param session: fastf1 Session object with loaded data
	:return: tuple of (figure, axis) with speed trace + corner markers of fastest lap across all drivers
	'''


	# Enable Matplotlib patches for plotting timedelta values and load
	# FastF1's dark color scheme
	fastf1.plotting.setup_mpl(mpl_timedelta_support=True, color_scheme='fastf1')
	# Select the fastest lap in the session
	fastest_lap = session.laps.pick_fastest()
	car_data = fastest_lap.get_car_data().add_distance()
	circuit_info = session.get_circuit_info()

	team_color = fastf1.plotting.get_team_color(fastest_lap['Team'],
                                            session=session)

	fig, ax = plt.subplots()
	ax.plot(car_data['Distance'], car_data['Speed'],
			color=team_color, label=fastest_lap['Driver'])

	# Draw vertical dotted lines at each corner that range from slightly below the
	# minimum speed to slightly above the maximum speed.
	v_min = car_data['Speed'].min()
	v_max = car_data['Speed'].max()
	ax.vlines(x=circuit_info.corners['Distance'], ymin=v_min-20, ymax=v_max+20,
			linestyles='dotted', colors='grey')

	# Plot the corner number just below each vertical line.
	# For corners that are very close together, the text may overlap. A more
	# complicated approach would be necessary to reliably prevent this.
	for _, corner in circuit_info.corners.iterrows():
		txt = f"{corner['Number']}{corner['Letter']}"
		ax.text(corner['Distance'], v_min-30, txt,
				va='center_baseline', ha='center', size='small')

	ax.set_xlabel('Distance in m')
	ax.set_ylabel('Speed in km/h')
	ax.legend()

	# Manually adjust the y-axis limits to include the corner numbers, because
	# Matplotlib does not automatically account for text that was manually added.
	ax.set_ylim([v_min - 40, v_max + 20])

	return fig, ax


