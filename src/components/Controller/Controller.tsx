import React, { RefObject, MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import styles from './Controller.module.css';
import * as Actions from '../../store/actions';
import * as Position from '../../utils/position';
import { StoreState } from '../../store/reducers';
import { Graph } from '../../utils/pathfinding/algorithms/graph';
import { Vertex } from '../../store/reducers/graph';
import { GraphTheme } from '../../utils/themes';
import { PathfindingStates } from '../../utils/pathfinding/pathfindingStates';

import Dropdown from '../UI/Dropdown/Dropdown';
import { pathfindingOptions } from '../../utils/pathfinding/pathfindingOptions';

interface ControllerProps {
	classNames?: string[];
	verticesRef: RefObject<HTMLDivElement>;
}

const Controller = (props: ControllerProps) => {
	let classNames = [styles.Controller];
	if (props.classNames) {
		classNames.push(...props.classNames);
	}
	const dispatch = useDispatch();

	const graph = useSelector<StoreState, Graph>((state) => state.graph.graph);
	const numRows = useSelector<StoreState, number>(
		(state) => state.graph.numRows
	);
	const numCols = useSelector<StoreState, number>(
		(state) => state.graph.numCols
	);
	const startVertex = useSelector<StoreState, Vertex | null>(
		(state) => state.graph.startVertex
	);
	const endVertex = useSelector<StoreState, Vertex | null>(
		(state) => state.graph.endVertex
	);
	const setTimeouts = useSelector<StoreState, NodeJS.Timeout[]>(
		(state) => state.graph.setTimeouts
	);
	const currentAlgorithm = useSelector<StoreState, Function>(
		(state) => state.graph.currentAlgorithm
	);
	const theme = useSelector<StoreState, GraphTheme>(
		(state) => state.graph.theme
	);

	const handleAnimation = (start: number, end: number) => {
		dispatch(Actions.clearPath(props.verticesRef));
		dispatch(Actions.setIsAnimating(true));

		let animations = currentAlgorithm(graph, start, end);

		for (let i = 0; i < animations.length; i++) {
			let animation = animations[i];
			let row = Math.floor(animation.index / numCols);
			let column = animation.index % numCols;
			let vertex: Vertex;

			vertex = Position.getVertex(
				row,
				column,
				numRows,
				numCols,
				props.verticesRef
			);

			setTimeouts.push(
				setTimeout(() => {
					if (animation.state === PathfindingStates.VISITING) {
						theme.visiting(vertex.element);
						if (i > 0) {
							let prevAnimation = animations[i - 1];
							let prevVertex = Position.getVertexAbsolute(
								prevAnimation.index,
								numRows,
								numCols,
								props.verticesRef
							);
							theme.visited(prevVertex.element);
						}
					} else if (
						animation.state ===
						PathfindingStates.PATH_HORIZONTAL_START
					) {
						theme.pathHorizontalStart(vertex.element);
					} else if (
						animation.state ===
						PathfindingStates.PATH_VERTICAL_START
					) {
						theme.pathVerticalStart(vertex.element);
					} else if (
						animation.state ===
						PathfindingStates.PATH_HORIZONTAL_END
					) {
						theme.pathHorizontalEnd(vertex.element);
					} else if (
						animation.state === PathfindingStates.PATH_VERTICAL_END
					) {
						theme.pathVerticalEnd(vertex.element);
					} else if (
						animation.state === PathfindingStates.PATH_HORIZONTAL
					) {
						theme.pathHorizontal(vertex.element);
					} else if (
						animation.state === PathfindingStates.PATH_VERTICAL
					) {
						theme.pathVertical(vertex.element);
					} else if (animation.state === PathfindingStates.DONE) {
						dispatch(Actions.setIsAnimating(false));
						dispatch(Actions.setIsDoneAnimating(true));
					}
				}, 10 * i)
			);
		}
	};

	const handleFindPath = () =>
		handleAnimation(
			startVertex?.absoluteIndex ? startVertex.absoluteIndex : 0,
			endVertex?.absoluteIndex ? endVertex?.absoluteIndex : 0
		);

	const handleClearPath = () => {
		dispatch(Actions.setIsAnimating(false));
		dispatch(Actions.setIsDoneAnimating(false));
		dispatch(Actions.clearPath(props.verticesRef));
	};
	const handleClearWalls = () =>
		dispatch(Actions.onClearWalls(props.verticesRef));
	const handleReset = () => {
		dispatch(Actions.setIsAnimating(false));
		dispatch(Actions.setIsDoneAnimating(false));
		dispatch(Actions.clearPath(props.verticesRef));
		dispatch(Actions.onClearWalls(props.verticesRef));
		dispatch(
			Actions.setStartVertex(
				Math.floor(numRows / 2),
				Math.floor(numCols / 4),
				props.verticesRef
			)
		);
		dispatch(
			Actions.setEndVertex(
				Math.floor(numRows / 2),
				Math.floor(numCols / 4) * 3,
				props.verticesRef
			)
		);
		dispatch(Actions.initGraph(props.verticesRef));
		dispatch(Actions.clearPath(props.verticesRef));
	};

	const handleAlgorithmChanged = (e: MouseEvent<HTMLLIElement>) => {
		dispatch(
			Actions.setCurrentAlgorithm(
				e.currentTarget.getAttribute('value') as string
			)
		);
	};

	return (
		<div className={classNames.join(' ')}>
			<div className={styles.Dropdowns}>
				<Dropdown
					name='pathfinding-algorithms'
					options={pathfindingOptions}
					onChange={handleAlgorithmChanged}
					classNames={[styles.Dropdown]}
					label='Algorithm:'
				></Dropdown>
			</div>
			<div className={styles.Buttons}>
				<button className={styles.Button} onClick={handleFindPath}>
					Find path
				</button>
				<button className={styles.Button} onClick={handleClearPath}>
					Clear path
				</button>
				<button className={styles.Button} onClick={handleClearWalls}>
					Clear Walls
				</button>
				<button className={styles.Button} onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
};

export default Controller;