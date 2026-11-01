<?php

namespace Drupal\plots_map\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// Drupal custom block starting point: https://www.drupal.org/docs/creating-modules/creating-custom-blocks/create-a-custom-block-plugin
/**
 * Provides a front-end ArcGIS map of North Dakota PLOTS using a public NDGF ArcGIS server for layer data.
 */
#[Block(
  id: 'plots_map_block',
  admin_label: new TranslatableMarkup('North Dakota PLOTS map'),
  category: new TranslatableMarkup('Maps'),
)]
// BlockBase API docs: https://www.drupal.org/docs/drupal-apis/block-api/block-api-overview
final class PlotsMapBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    // Set default starting point to Bismarck, ND
    return parent::defaultConfiguration() + [
      'center_longitude' => -100.78374,
      'center_latitude' => 46.80833,
      'zoom' => 9,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);
    $form['center_longitude'] = [
      '#type' => 'number',
      '#title' => $this->t('Starting longitude'),
      '#default_value' => $this->configuration['center_longitude'],
      '#step' => 'any',
      '#min' => -180,
      '#max' => 180,
      '#required' => TRUE,
    ];
    $form['center_latitude'] = [
      '#type' => 'number',
      '#title' => $this->t('Starting latitude'),
      '#default_value' => $this->configuration['center_latitude'],
      '#step' => 'any',
      '#min' => -90,
      '#max' => 90,
      '#required' => TRUE,
    ];
    $form['zoom'] = [
      '#type' => 'number',
      '#title' => $this->t('Starting zoom'),
      '#default_value' => $this->configuration['zoom'],
      '#min' => 1,
      '#max' => 20,
      '#required' => TRUE,
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    parent::blockSubmit($form, $form_state);
    $this->configuration['center_longitude'] = (float) $form_state->getValue('center_longitude');
    $this->configuration['center_latitude'] = (float) $form_state->getValue('center_latitude');
    $this->configuration['zoom'] = (int) $form_state->getValue('zoom');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['plots-map'],
        'data-center-longitude' => (string) $this->configuration['center_longitude'],
        'data-center-latitude' => (string) $this->configuration['center_latitude'],
        'data-zoom' => (string) $this->configuration['zoom'],
      ],
      'view' => [
        '#type' => 'container',
        '#attributes' => [
          'class' => ['plots-map__view'],
          'role' => 'application',
          'aria-label' => $this->t('North Dakota PLOTS map'),
        ],
      ],
      'status' => [
        '#type' => 'html_tag',
        '#tag' => 'div',
        '#value' => $this->t('Loading map…'),
        '#attributes' => [
          'class' => ['plots-map__status'],
          'role' => 'status',
          'aria-live' => 'polite',
        ],
      ],
      '#attached' => [
        'library' => ['plots_map/map'],
      ],
    ];
  }

}
