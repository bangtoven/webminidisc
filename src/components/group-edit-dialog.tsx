import React, { useCallback, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import DragIndicator from '@mui/icons-material/DragIndicator';
import { makeStyles } from 'tss-react/mui';
import { DragDropContext, Draggable, DraggableProvided, Droppable, DroppableProvided, DropResult } from 'react-beautiful-dnd';
import { formatTimeFromSeconds } from '../utils';

export type GroupEditInput = {
    index: number;
    title: string;
    trackCount: number;
    duration: number;
};

export type GroupEditOutput = {
    index: number;
    title: string;
    ungroup: boolean;
};

type GroupEditDialogProps = {
    visible: boolean;
    groups: GroupEditInput[];
    onClose: () => void;
    onApply: (groups: GroupEditOutput[]) => void;
};

const useStyles = makeStyles()((theme) => ({
    dragHandle: {
        width: 20,
        padding: `${theme.spacing(0.5)} 0 0 0`,
    },
    titleField: {
        minWidth: 280,
    },
}));

export function GroupEditDialog({ visible, groups, onClose, onApply }: GroupEditDialogProps) {
    const { classes } = useStyles();
    const [drafts, setDrafts] = useState<(GroupEditInput & { ungroup: boolean })[]>([]);

    useEffect(() => {
        if (!visible) return;
        setDrafts(groups.map((g) => ({ ...g, ungroup: false })));
    }, [visible, groups]);

    const handleDrop = useCallback((result: DropResult) => {
        const destination = result.destination;
        if (!destination) return;
        if (result.source.index === destination.index) return;
        setDrafts((prev) => {
            const next = [...prev];
            const [moved] = next.splice(result.source.index, 1);
            next.splice(destination.index, 0, moved);
            return next;
        });
    }, []);

    const handleTitleChange = useCallback((index: number, title: string) => {
        setDrafts((prev) => prev.map((g, i) => (i === index ? { ...g, title } : g)));
    }, []);

    const handleUngroupChange = useCallback((index: number, ungroup: boolean) => {
        setDrafts((prev) => prev.map((g, i) => (i === index ? { ...g, ungroup } : g)));
    }, []);

    const handleApply = useCallback(() => {
        onApply(drafts.map((g) => ({ index: g.index, title: g.title, ungroup: g.ungroup })));
    }, [drafts, onApply]);

    return (
        <Dialog open={visible} fullWidth maxWidth="md">
            <DialogTitle>Edit Groups</DialogTitle>
            <DialogContent>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell className={classes.dragHandle}></TableCell>
                            <TableCell>#</TableCell>
                            <TableCell>Group Name</TableCell>
                            <TableCell align="right">Tracks</TableCell>
                            <TableCell align="right">Duration</TableCell>
                            <TableCell align="right">Ungroup</TableCell>
                        </TableRow>
                    </TableHead>
                    <DragDropContext onDragEnd={handleDrop}>
                        <Droppable droppableId="group-edit-list">
                            {(provided: DroppableProvided) => (
                                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                    {drafts.map((group, index) => (
                                        <Draggable draggableId={`group-edit-${group.index}`} index={index} key={`group-edit-${group.index}`}>
                                            {(draggableProvided: DraggableProvided) => (
                                                <TableRow ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                                                    <TableCell
                                                        className={classes.dragHandle}
                                                        {...draggableProvided.dragHandleProps}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DragIndicator fontSize="small" color="disabled" />
                                                    </TableCell>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={group.title}
                                                            onChange={(e) => handleTitleChange(index, e.target.value)}
                                                            size="small"
                                                            variant="standard"
                                                            className={classes.titleField}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">{group.trackCount}</TableCell>
                                                    <TableCell align="right">{formatTimeFromSeconds(group.duration)}</TableCell>
                                                    <TableCell align="right">
                                                        <Checkbox
                                                            checked={group.ungroup}
                                                            onChange={(e) => handleUngroupChange(index, e.target.checked)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </TableBody>
                            )}
                        </Droppable>
                    </DragDropContext>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleApply} disabled={drafts.length === 0}>
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
}
