import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DialogContent, DialogTitle, useMediaQuery } from '@mui/material';
import ResponsiveDialog from './ResponsiveDialog';

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

const originalViewport = window.visualViewport;
let viewport: EventTarget & { height: number; offsetTop: number };

beforeEach(() => {
  (useMediaQuery as jest.Mock).mockReturnValue(true);
  viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
});

afterEach(() => {
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: originalViewport });
});

test('keeps the form within the visible viewport as the keyboard opens, pans and closes', () => {
  render(
    <ResponsiveDialog open mobileKeyboardAware variant="plain">
      <DialogTitle>New note</DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
        <input aria-label="Title" />
      </DialogContent>
    </ResponsiveDialog>
  );

  const input = screen.getByRole('textbox');
  const paper = input.closest('.MuiDrawer-paper') as HTMLElement;
  const layer = paper.closest('.MuiDrawer-root') as HTMLElement;
  const scroller = paper.firstElementChild as HTMLElement;

  expect(getComputedStyle(layer).height).toBe('800px');
  expect(getComputedStyle(scroller).overflow).toBe('auto');

  act(() => {
    input.focus();
    viewport.height = 340;
    viewport.offsetTop = 120;
    viewport.dispatchEvent(new Event('resize'));
    viewport.dispatchEvent(new Event('scroll'));
  });

  expect(getComputedStyle(layer).height).toBe('340px');
  expect(getComputedStyle(layer).top).toBe('120px');
  expect(getComputedStyle(paper).position).toBe('absolute');
  expect(getComputedStyle(paper).maxHeight).toBe('min(92vh, 340px)');
  expect(document.activeElement).toBe(input);

  act(() => {
    input.blur();
    viewport.height = 800;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('resize'));
  });

  expect(getComputedStyle(layer).height).toBe('800px');
  expect(getComputedStyle(layer).top).toBe('0px');
});

test('scroll gestures do not dismiss the mobile form, while the backdrop still closes it', () => {
  const onClose = jest.fn();
  render(
    <ResponsiveDialog open mobileKeyboardAware onClose={onClose} variant="plain">
      <DialogContent><input aria-label="Title" /></DialogContent>
    </ResponsiveDialog>
  );
  const input = screen.getByRole('textbox');
  const paper = input.closest('.MuiDrawer-paper') as HTMLElement;
  fireEvent.touchStart(input, { touches: [{ clientX: 100, clientY: 100 }] });
  fireEvent.touchMove(input, { touches: [{ clientX: 100, clientY: 500 }] });
  fireEvent.touchEnd(input, { changedTouches: [{ clientX: 100, clientY: 500 }] });
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.click(paper.closest('.MuiDrawer-root')!.querySelector('.MuiBackdrop-root')!);
  expect(onClose).toHaveBeenCalledWith(expect.anything(), 'backdropClick');
});

test('keeps the desktop dialog when keyboard-aware mobile forms are enabled', () => {
  (useMediaQuery as jest.Mock).mockReturnValue(false);
  render(
    <ResponsiveDialog open mobileKeyboardAware variant="plain">
      <DialogTitle>New note</DialogTitle>
    </ResponsiveDialog>
  );
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(document.querySelector('.MuiDrawer-root')).toBeNull();
});
